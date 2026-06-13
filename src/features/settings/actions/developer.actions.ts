'use server';

import { db } from "@shared/lib/db";
import { getTokenEncryptionService } from '@features/settings/services/token-encryption.service';
import { getMetaGraphClient } from '@shared/api/meta/graph-api.client';

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
 * Hàm trợ giúp xử lý cập nhật đơn lẻ cho từng tài khoản
 */
async function processSingleAccount(
  page: MetaAccountInput,
  workspaceId: string,
  profileId: string
): Promise<UpsertResult> {
  if (!page.id || !page.access_token || !page.name) {
    return {
      id: page.id || 'N/A',
      name: page.name || 'Không rõ tên',
      success: false,
      message: 'Thiếu trường id, name hoặc access_token bắt buộc'
    };
  }

  try {
    const encryption = getTokenEncryptionService();
    // Mã hóa access token
    const encryptRes = await encryption.encrypt(page.access_token);
    if (encryptRes.error || !encryptRes.data) {
      return {
        id: page.id,
        name: page.name,
        success: false,
        message: encryptRes.error || 'Lỗi mã hóa token'
      };
    }
    const encryptedToken = encryptRes.data;

    // 1. Kiểm tra tính hợp lệ và lấy thời hạn thực tế của Token qua debug_token
    let tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Mặc định 60 ngày
    try {
      const graphClient = getMetaGraphClient();
      const debugRes = await graphClient.debugToken(page.access_token);
      if (debugRes.error) {
        console.warn(`[DeveloperAction] Lỗi debug token cho trang ${page.id}:`, debugRes.error);
        // Không quăng lỗi, vẫn cho phép tiếp tục với hạn mặc định 60 ngày để fallback
      } else if (debugRes.data && debugRes.data.data) {
        const debugData = debugRes.data.data;
        if (!debugData.is_valid) {
          return {
            id: page.id,
            name: page.name,
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn trên hệ thống Facebook'
          };
        }
        if (debugData.expires_at > 0) {
          tokenExpiry = new Date(debugData.expires_at * 1000);
        } else {
          // expires_at === 0 có nghĩa là Never Expires (Long-lived Page Access Token)
          tokenExpiry = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 năm
        }
      }
    } catch (debugErr) {
      console.warn(`[DeveloperAction] Lỗi kết nối khi debug token cho trang ${page.id}:`, debugErr);
    }

    // 2. Tra cứu linked Instagram account ID qua Graph API
    let instagramId: string | null = null;
    let instagramName: string | null = null;
    try {
      const igUrl = `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account{id,name,username}&access_token=${page.access_token}`;
      const igRes = await fetch(igUrl, { signal: AbortSignal.timeout(10000) });
      if (igRes.ok) {
        const igJson = await igRes.json() as any;
        instagramId = igJson.instagram_business_account?.id || null;
        instagramName = igJson.instagram_business_account?.username || igJson.instagram_business_account?.name || null;
      } else {
        const errJson = await igRes.json() as any;
        console.warn(`[DeveloperAction] Lỗi Graph API khi lấy Instagram liên kết của trang ${page.id}:`, errJson.error?.message);
      }
    } catch (igErr) {
      console.warn(`[DeveloperAction] Không thể truy vấn thông tin Instagram của trang ${page.id}:`, igErr);
    }

    // 3. Chạy transaction cập nhật DB cô lập cho tài khoản này
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
          workspaceId: workspaceId,
          disconnected_at: null,
          metadata: {
            category: page.category || 'N/A',
            instagram_id: instagramId
          },
        },
        create: {
          workspaceId: workspaceId,
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
      if (instagramId) {
        const igAccount = await tx.platformAccount.upsert({
          where: {
            platform_platform_user_id: {
              platform: 'instagram',
              platform_user_id: instagramId,
            },
          },
          update: {
            platform_user_name: instagramName || page.name,
            workspaceId: workspaceId,
            disconnected_at: null,
            metadata: {
              facebook_page_id: page.id,
              category: page.category || 'N/A'
            },
          },
          create: {
            workspaceId: workspaceId,
            profile_id: profileId,
            platform: 'instagram',
            platform_user_id: instagramId,
            platform_user_name: instagramName || page.name,
            metadata: {
              facebook_page_id: page.id,
              category: page.category || 'N/A'
            },
          },
        });

        // Upsert token cho Instagram
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

    return {
      id: page.id,
      name: page.name,
      success: true,
      message: 'Cập nhật tài khoản và token thành công',
      instagramId
    };
  } catch (err: any) {
    console.error(`[DeveloperAction] Lỗi xử lý database/API cho account ${page.id}:`, err);
    return {
      id: page.id,
      name: page.name,
      success: false,
      message: err.message || 'Lỗi xử lý cơ sở dữ liệu'
    };
  }
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

    // 3. Xử lý song song bằng Promise.allSettled
    const rawResults = await Promise.allSettled(
      inputData.map(page => processSingleAccount(page, workspace.id, profileId))
    );

    // Mapped results
    const results: UpsertResult[] = rawResults.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
      return {
        id: inputData[index]?.id || 'N/A',
        name: inputData[index]?.name || 'Không rõ tên',
        success: false,
        message: res.reason?.message || 'Lỗi bất đồng bộ ngoài tầm kiểm soát'
      };
    });

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
