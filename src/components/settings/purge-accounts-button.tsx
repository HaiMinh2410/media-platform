'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { purgeOldAccountsAction } from '@/application/actions/platform-account.actions';
import { Trash2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

export function PurgeAccountsButton({ workspaceId }: { workspaceId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePurge = async () => {
    if (!confirm('Dọn dẹp sẽ xóa vĩnh viễn các tài khoản đã ngắt kết nối hơn 30 ngày. Bạn có chắc chắn?')) return;

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
    <Button 
      variant="outline" 
      onClick={handlePurge} 
      isLoading={loading}
      className="w-full text-error border-error/20 hover:bg-error/5 hover:border-error/40 flex items-center justify-center gap-2"
    >
      <Icon lucide={Trash2} size={16} />
      Dọn dẹp dữ liệu cũ ({'>'}30 ngày)
    </Button>
  );
}
