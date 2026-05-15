import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { WorkspaceCredentials } from '@/components/settings/workspace-credentials';
import { MetaTokenUpserter } from '@/components/settings/meta-token-upserter';
import { ArrowRight } from 'lucide-react';

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
      <div className="p-8 text-center bg-error/5 border border-error/10 rounded-2xl">
        <p className="text-foreground-secondary">No workspace found. Please contact support or try reconnecting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Workspace credentials / server meta-data */}
      <WorkspaceCredentials 
        workspaceId={workspace.id} 
        workspaceName={workspace.name}
        verifyToken={process.env.META_WEBHOOK_VERIFY_TOKEN || ''}
        skipVerify={process.env.SKIP_WEBHOOK_VERIFY || 'false'}
      />

      {/* Manual Token Updater Tool */}
      <MetaTokenUpserter />

      {/* Detailed visual navigation cards for developer features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Connection Debugger */}
        <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl hover:bg-foreground/[0.04] transition-all flex flex-col justify-between group">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              Debug Connection Tool
            </h3>
            <p className="text-foreground-secondary text-xs font-semibold mb-3">
              Chẩn đoán, làm mới token và gỡ lỗi kết nối tài khoản
            </p>
            <p className="text-foreground-tertiary text-sm leading-relaxed mb-6">
              Gặp sự cố tin nhắn không đồng bộ? Hãy dùng công cụ chẩn đoán chuyên sâu này để xem trạng thái phân quyền (Scopes) của Page Token, thực hiện reset kết nối, gỡ lỗi hoặc cập nhật Access Token thủ công để khôi phục luồng tin nhắn.
            </p>
          </div>
          <Link 
            href="/dashboard/settings/accounts/debug"
            className="btn btn-sm btn-primary text-white font-bold self-start flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 no-underline"
          >
            Mở Công cụ Sửa lỗi <ArrowRight size={14} />
          </Link>
        </div>

        {/* Tool 2: Webhook Console */}
        <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl hover:bg-foreground/[0.04] transition-all flex flex-col justify-between group">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              Webhook & API Console
            </h3>
            <p className="text-foreground-secondary text-xs font-semibold mb-3">
              Môi trường giả lập Webhook thời gian thực và gọi API
            </p>
            <p className="text-foreground-tertiary text-sm leading-relaxed mb-6">
              Môi trường sandbox cực mạnh cho lập trình viên. Gửi các webhook Meta Messenger / Instagram giả lập để test ứng dụng, quan sát luồng logs chạy realtime qua WebSocket, dọn dẹp logs DB và thử nghiệm gọi các API endpoints nhanh chóng.
            </p>
          </div>
          <Link 
            href="/dashboard/dev"
            className="btn btn-sm btn-primary text-white font-bold self-start flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 no-underline"
          >
            Mở Bảng điều khiển Webhook <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
