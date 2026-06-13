'use client';

import React, { useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { DebugForm } from '@/app/dashboard/settings/accounts/debug/debug-form';
import { DevPanel } from '@/app/dashboard/dev/dev-panel';

interface DeveloperToolsProps {
  workspaceId: string;
  accounts: any[];
  verifyToken: string;
}

export function DeveloperTools({ workspaceId, accounts, verifyToken }: DeveloperToolsProps) {
  const debugModalRef = useRef<HTMLDialogElement>(null);
  const webhookModalRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      {/* Detailed visual navigation cards for developer features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: Connection Debugger */}
        <div className="card bg-base-100 border border-base-content/5 shadow-sm p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group rounded-xl">
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
          <button 
            onClick={() => debugModalRef.current?.showModal()}
            className="btn btn-sm btn-primary self-start flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 animate-in fade-in cursor-pointer rounded-md"
          >
            Mở Công cụ Sửa lỗi <ArrowRight size={14} />
          </button>
        </div>

        {/* Tool 2: Webhook Console */}
        <div className="card bg-base-100 border border-base-content/5 shadow-sm p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group rounded-xl">
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
          <button 
            onClick={() => webhookModalRef.current?.showModal()}
            className="btn btn-sm btn-primary self-start flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 animate-in fade-in cursor-pointer rounded-md"
          >
            Mở Bảng điều khiển Webhook <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Dialog 1: Connection Debugger Modal */}
      <dialog ref={debugModalRef} className="modal">
        <div className="modal-box max-w-2xl bg-base-100 border border-base-content/10 shadow-2xl rounded-2xl relative p-6">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/50 hover:text-base-content z-50 cursor-pointer">
              <X size={16} />
            </button>
          </form>
          <h3 className="font-bold text-lg text-base-content mb-6 flex items-center gap-2">
            Debug Connection Tool
          </h3>
          <div className="mt-2">
            <DebugForm workspaceId={workspaceId} />
          </div>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40 backdrop-blur-xs">
          <button className="cursor-default">Close</button>
        </form>
      </dialog>

      {/* Dialog 2: Webhook Console Modal */}
      <dialog ref={webhookModalRef} className="modal">
        <div className="modal-box max-w-7xl w-11/12 bg-base-100 border border-base-content/10 shadow-2xl rounded-2xl relative p-6">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/50 hover:text-base-content z-50 cursor-pointer">
              <X size={16} />
            </button>
          </form>
          <h3 className="font-bold text-lg text-base-content mb-4">
            Webhook & API Console
          </h3>
          <div className="mt-2 overflow-y-auto max-h-[80vh]">
            <DevPanel 
              workspaceId={workspaceId} 
              connectedAccounts={accounts}
              verifyToken={verifyToken}
            />
          </div>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40 backdrop-blur-xs">
          <button className="cursor-default">Close</button>
        </form>
      </dialog>
    </>
  );
}
