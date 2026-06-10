'use client';

import { ConfirmDialog } from "@shared/ui";
import { useState } from 'react';
import { purgeOldAccountsAction } from '@features/settings/actions/platform-account.actions';
import { Trash2 } from 'lucide-react';

export function PurgeAccountsButton({ workspaceId }: { workspaceId: string }) {
  const [loading, setLoading] = useState(false);

  const triggerPurge = () => {
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('purge-confirm-modal') as HTMLDialogElement;
      modal?.showModal();
    }
  };

  const handlePurge = async () => {
    setLoading(true);
    const result = await purgeOldAccountsAction(workspaceId);
    setLoading(false);

    if (result.error) {
      alert('Lỗi: ' + result.error);
    } else {
      alert(`Đã dọn dẹp ${result.count} tài khoản cũ.`);
    }
  };

  return (
    <>
      <button 
        onClick={triggerPurge} 
        disabled={loading}
        className="btn btn-soft btn-error rounded-full w-full gap-2 font-bold h-10 min-h-0"
      >
        {loading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Trash2 size={16} />
        )}
        Dọn dẹp dữ liệu cũ ({' > '}30 ngày)
      </button>

      <ConfirmDialog 
        id="purge-confirm-modal"
        title="Dọn dẹp dữ liệu cũ"
        description="Dọn dẹp sẽ xóa vĩnh viễn các tài khoản đã ngắt kết nối hơn 30 ngày. Toàn bộ dữ liệu hội thoại của tài khoản bị xóa sẽ không thể phục hồi. Bạn có chắc chắn muốn thực hiện?"
        confirmText="Dọn dẹp vĩnh viễn"
        cancelText="Hủy"
        confirmBtnClass="btn-error"
        onConfirm={handlePurge}
      />
    </>
  );
}

