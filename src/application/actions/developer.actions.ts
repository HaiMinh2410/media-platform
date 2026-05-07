'use server';

import { db } from '@/lib/db';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';

interface MetaAccountInput {
  access_token: string;
  category: string;
  name: string;
  id: string;
  tasks?: string[];
  category_list?: { id: string; name: string }[];
}

interface UpsertResult {
  id: string;
  name: string;
  success: boolean;
  message: string;
  instagramId?: string | null;
}

/**
 * Server Action xử lý dán JSON tài khoản Meta để cập nhật token thủ công
 */
export async function upsertMetaAccountsFromJsonAction(jsonString: string): Promise<{
  success: boolean;
  message: string;
  results: UpsertResult[];
}> {
  try {
    if (!jsonString || jsonString.trim() === '') {
      return { success: false, message: 'Dữ liệu JSON không được để trống', results: [] };
    }

    // 1. Phân tích chuỗi JSON
    let inputData: MetaAccountInput[] = [];
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.data)) {
        inputData = parsed.data;
      } else if (Array.isArray(parsed)) {
        inputData = parsed;
      } else {
        return {
          success: false,
          message: 'Định dạng JSON không hợp lệ. Phải chứa mảng "data" hoặc là một mảng danh sách tài khoản.',
          results: []
        };
      }
    } catch (e) {
      return { success: false, message: 'Chuỗi nhập vào không phải là JSON hợp lệ', results: [] };
    }

    if (inputData.length === 0) {
      return { success: false, message: 'Không tìm thấy tài khoản nào trong JSON', results: [] };
    }

    // 2. Lấy workspace đầu tiên để liên kết
    const workspace = await db.workspace.findFirst({
      include: { workspace_members: { take: 1 } },
    });

    if (!workspace) {
      return { success: false, message: 'Không tìm thấy Workspace nào trong hệ thống', results: [] };
    }

    const profileId = workspace.workspace_members[0]?.profile_id;
    if (!profileId) {
      return {
        success: false,
        message: `Workspace "${workspace.name}" chưa cấu hình thành viên. Không có profile_id để tạo tài khoản.`,
        results: []
      };
    }

    const encryption = getTokenEncryptionService();
    const results: UpsertResult[] = [];

    // 3. Xử lý từng tài khoản
    for (const page of inputData) {
      if (!page.id || !page.access_token || !page.name) {
        results.push({
          id: page.id || 'N/A',
          name: page.name || 'Không rõ tên',
          success: false,
          message: 'Thiếu trường id, name hoặc access_token bắt buộc'
        });
        continue;
      }

      try {
        // Mã hóa access token
        const encryptRes = await encryption.encrypt(page.access_token);
        if (encryptRes.error || !encryptRes.data) {
          throw new Error(encryptRes.error || 'Lỗi mã hóa token');
        }
        const encryptedToken = encryptRes.data;

        // Tra cứu linked Instagram account ID qua Graph API
        let instagramId: string | null = null;
        try {
          const igUrl = `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
          const igRes = await fetch(igUrl, { signal: AbortSignal.timeout(10000) });
          if (igRes.ok) {
            const igJson = await igRes.json() as any;
            instagramId = igJson.instagram_business_account?.id || null;
          }
        } catch (igErr) {
          console.warn(`[DeveloperAction] Không thể lấy thông tin Instagram cho page ${page.id}:`, igErr);
        }

        // Chạy transaction cập nhật DB
        await db.$transaction(async (tx) => {
          // 3a. Upsert Facebook Page vào platform_accounts
          const account = await tx.platformAccount.upsert({
            where: {
              platform_platform_user_id: {
                platform: 'facebook',
                platform_user_id: page.id,
              },
            },
            update: {
              platform_user_name: page.name,
              workspaceId: workspace.id,
              disconnected_at: null,
              metadata: {
                category: page.category || 'N/A',
                instagram_id: instagramId
              },
            },
            create: {
              workspaceId: workspace.id,
              profile_id: profileId,
              platform: 'facebook',
              platform_user_id: page.id,
              platform_user_name: page.name,
              metadata: {
                category: page.category || 'N/A',
                instagram_id: instagramId
              },
            },
          });

          // 3b. Upsert meta_tokens cho Facebook Page
          const existingToken = await tx.meta_tokens.findFirst({
            where: { account_id: account.id },
          });

          const tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 ngày

          if (existingToken) {
            await tx.meta_tokens.update({
              where: { id: existingToken.id },
              data: {
                encrypted_access_token: encryptedToken,
                expires_at: tokenExpiry,
                updated_at: new Date(),
              },
            });
          } else {
            await tx.meta_tokens.create({
              data: {
                account_id: account.id,
                encrypted_access_token: encryptedToken,
                expires_at: tokenExpiry,
              },
            });
          }

          // 3c. Nếu có liên kết Instagram, upsert luôn tài khoản Instagram làm PlatformAccount riêng
          // Điều này giúp Inbox của ứng dụng hoạt động chính xác với cả Instagram!
          if (instagramId) {
            const igAccount = await tx.platformAccount.upsert({
              where: {
                platform_platform_user_id: {
                  platform: 'instagram',
                  platform_user_id: instagramId,
                },
              },
              update: {
                platform_user_name: `${page.name} (Instagram)`,
                workspaceId: workspace.id,
                disconnected_at: null,
                metadata: {
                  facebook_page_id: page.id,
                  category: page.category || 'N/A'
                },
              },
              create: {
                workspaceId: workspace.id,
                profile_id: profileId,
                platform: 'instagram',
                platform_user_id: instagramId,
                platform_user_name: `${page.name} (Instagram)`,
                metadata: {
                  facebook_page_id: page.id,
                  category: page.category || 'N/A'
                },
              },
            });

            // Upsert token cho Instagram (Instagram sử dụng cùng Page Access Token để gửi/nhận tin nhắn)
            const existingIgToken = await tx.meta_tokens.findFirst({
              where: { account_id: igAccount.id },
            });

            if (existingIgToken) {
              await tx.meta_tokens.update({
                where: { id: existingIgToken.id },
                data: {
                  encrypted_access_token: encryptedToken,
                  expires_at: tokenExpiry,
                  updated_at: new Date(),
                },
              });
            } else {
              await tx.meta_tokens.create({
                data: {
                  account_id: igAccount.id,
                  encrypted_access_token: encryptedToken,
                  expires_at: tokenExpiry,
                },
              });
            }
          }
        });

        results.push({
          id: page.id,
          name: page.name,
          success: true,
          message: 'Đã cập nhật tài khoản và token thành công',
          instagramId
        });
      } catch (err: any) {
        results.push({
          id: page.id,
          name: page.name,
          success: false,
          message: err.message || 'Lỗi xử lý cơ sở dữ liệu'
        });
      }
    }

    const overallSuccess = results.some(r => r.success);
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? `Đã xử lý xong. Thành công: ${results.filter(r => r.success).length}/${results.length} tài khoản.`
        : 'Cập nhật tài khoản thất bại.',
      results
    };
  } catch (error: any) {
    console.error('[DeveloperAction] Global error:', error);
    return {
      success: false,
      message: error.message || 'Đã xảy ra lỗi hệ thống',
      results: []
    };
  }
}
