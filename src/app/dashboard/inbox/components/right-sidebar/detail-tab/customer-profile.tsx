import { ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerProfileProps {
  customerName?: string;
  customerAvatar?: string;
  platform: string;
  customerUsername?: string;
  customerLink?: string;
  isSyncing: boolean;
  onSyncProfile: () => void;
  onToggleCollapse: () => void;
}

export function CustomerProfile({
  customerName,
  customerAvatar,
  platform,
  customerUsername,
  customerLink,
  isSyncing,
  onSyncProfile,
  onToggleCollapse
}: CustomerProfileProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-surface-primary border border-white/10 overflow-hidden flex items-center justify-center text-lg font-bold">
        {customerAvatar ? (
          <img src={customerAvatar} alt={customerName} className="w-full h-full object-cover" />
        ) : (
          customerName?.charAt(0) || 'U'
        )}
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        <h4 className="text-md font-bold text-foreground truncate">{customerName || 'Unknown'}</h4>
        {platform === 'instagram' ? (
          customerUsername ? (
            <a 
              href={`https://www.instagram.com/${customerUsername}/`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-accent-primary hover:underline"
            >
              Xem trang cá nhân
            </a>
          ) : (
            <>
              <span 
                className="text-xs text-foreground-tertiary cursor-help" 
                title="Chưa đồng bộ được username Instagram. Nhấn 'Làm mới' để thử lại."
              >
                Chưa có liên kết
              </span>
              <button 
                className="inline-flex items-center gap-1 text-2xs text-foreground-tertiary hover:text-foreground mt-1 transition-colors disabled:opacity-50" 
                onClick={onSyncProfile}
                disabled={isSyncing}
              >
                <RefreshCw size={12} className={cn(isSyncing && "animate-spin")} />
                Làm mới
              </button>
            </>
          )
        ) : (
          customerLink ? (
            <a 
              href={customerLink} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-accent-primary hover:underline"
            >
              Xem trang cá nhân
            </a>
          ) : (
            <>
              <span 
                className="text-xs text-foreground-tertiary cursor-help" 
                title="Facebook hạn chế link trang cá nhân qua API nếu không có quyền user_link. Nhấn 'Làm mới' để thử lại."
              >
                Chưa có liên kết
              </span>
              <button 
                className="inline-flex items-center gap-1 text-2xs text-foreground-tertiary hover:text-foreground mt-1 transition-colors disabled:opacity-50" 
                onClick={onSyncProfile}
                disabled={isSyncing}
              >
                <RefreshCw size={12} className={cn(isSyncing && "animate-spin")} />
                Làm mới
              </button>
            </>
          )
        )}
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 text-foreground-tertiary hover:text-foreground hover:bg-white/5 rounded-md transition-all" onClick={onToggleCollapse}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
