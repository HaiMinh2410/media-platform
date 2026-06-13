import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@shared/api/supabase/server';
import { getWorkspaceRepository } from '@features/settings/repositories/workspace.repository';
import { getPlatformAccountRepository } from '@features/settings/repositories/platform-account.repository';
import { MetaTokenUpserter } from '@features/settings/components/meta-token-upserter';
import { LinkedTokensList } from '@features/settings/components/linked-tokens-list';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default async function DeveloperSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace, error: wsError } = await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto shadow-sm">
        <AlertCircle size={20} className="shrink-0" />
        <span>No workspace found. Please contact support or try reconnecting.</span>
      </div>
    );
  }

  // Fetch all accounts with tokens for developer info
  const platformRepo = getPlatformAccountRepository();
  const { data: accounts = [] } = await platformRepo.findWithTokensByWorkspaceId(workspace.id);

  return (
    <div className="flex flex-col gap-8">
      {/* Linked Tokens & IDs Info */}
      <LinkedTokensList accounts={accounts as any} />

      
      {/* Manual Token Updater Tool */}
      <MetaTokenUpserter />

      {/* Detailed visual navigation cards for developer features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Connection Debugger */}
        <div className="card bg-base-100 border border-base-content/5 shadow-sm p-6 hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <h3 className="card-title text-base font-bold text-base-content mb-1 group-hover:text-primary transition-colors">
              Debug Connection Tool
            </h3>
            <p className="text-base-content/70 text-xs font-semibold mb-3">
              Chẩn đoán, làm mới token và gỡ lỗi kết nối tài khoản
            </p>
            <p className="text-base-content/50 text-sm leading-relaxed mb-6">
              Gặp sự cố tin nhắn không đồng bộ? Hãy dùng công cụ chẩn đoán chuyên sâu này để xem trạng thái phân quyền (Scopes) của Page Token, thực hiện reset kết nối, gỡ lỗi hoặc cập nhật Access Token thủ công để khôi phục luồng tin nhắn.
            </p>
          </div>
          <Link 
            href="/dashboard/settings/accounts/debug"
            className="btn btn-sm btn-primary self-start flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 no-underline animate-in fade-in"
          >
            Mở Công cụ Sửa lỗi <ArrowRight size={14} />
          </Link>
        </div>

        {/* Tool 2: Webhook Console */}
        <div className="card bg-base-100 border border-base-content/5 shadow-sm p-6 hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <h3 className="card-title text-base font-bold text-base-content mb-1 group-hover:text-primary transition-colors">
              Webhook & API Console
            </h3>
            <p className="text-base-content/70 text-xs font-semibold mb-3">
              Môi trường giả lập Webhook thời gian thực và gọi API
            </p>
            <p className="text-base-content/50 text-sm leading-relaxed mb-6">
              Môi trường sandbox cực mạnh cho lập trình viên. Gửi các webhook Meta Messenger / Instagram giả lập để test ứng dụng, quan sát luồng logs chạy realtime qua WebSocket, dọn dẹp logs DB và thử nghiệm gọi các API endpoints nhanh chóng.
            </p>
          </div>
          <Link 
            href="/dashboard/dev"
            className="btn btn-sm btn-primary self-start flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 no-underline animate-in fade-in"
          >
            Mở Bảng điều khiển Webhook <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

