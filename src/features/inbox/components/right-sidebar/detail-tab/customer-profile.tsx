import { cn } from "@shared/lib";
import { AccountAvatar } from "@shared/ui";

import { ChevronRight, RefreshCw } from "lucide-react";

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
  onToggleCollapse,
}: CustomerProfileProps) {
  return (
    <div className="flex items-center gap-3">
      <AccountAvatar
        avatarUrl={customerAvatar}
        name={customerName || "Unknown"}
        platform={platform}
        size="lg"
        showPlatformIcon={false}
      />
      <div className="flex-1 flex gap-2">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-base font-bold text-base-content truncate">
            {customerName || "Unknown"}
          </h4>
          {platform === "instagram" ? (
            customerUsername ? (
              <a
                href={`https://www.instagram.com/${customerUsername}/`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Xem trang cá nhân
              </a>
            ) : (
              <span
                className="text-xs text-base-content/40 cursor-help"
                title="Chưa đồng bộ được username Instagram. Nhấn nút 'Làm mới' bên phải để thử lại."
              >
                Chưa có liên kết
              </span>
            )
          ) : customerLink ? (
            <a
              href={customerLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Xem trang cá nhân
            </a>
          ) : (
            <span
              className="text-xs text-base-content/40 cursor-help"
              title="Facebook hạn chế link trang cá nhân qua API nếu không có quyền user_link. Nhấn nút 'Làm mới' bên phải để thử lại."
            >
              Chưa có liên kết
            </span>
          )}
        </div>
        <button
          className="btn bg-transparent btn-circle border-none shadow-none text-base-content/60 hover:text-base-content disabled:opacity-50 cursor-pointer"
          onClick={onSyncProfile}
          disabled={isSyncing}
          title="Làm mới thông tin khách hàng"
        >
          <RefreshCw size={15} className={cn(isSyncing && "animate-spin")} />
        </button>
      </div>

      <button
        className="p-2 text-base-content/40 hover:text-base-content hover:bg-base-content/5 rounded-md transition-all animate-none bg-transparent border-none cursor-pointer"
        onClick={onToggleCollapse}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
