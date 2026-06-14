'use client';

import { cn } from "@shared/lib";
import { AccountAvatar } from "@shared/ui";

import React from "react";
import { createPortal } from "react-dom";
import { X, Check, Users } from "lucide-react";
import {
  getPlatformAccountsAction,
  createAccountGroupAction,
  PlatformAccount,
} from "@features/settings";

interface CreateClusterModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClusterModal({
  workspaceId,
  onClose,
  onCreated,
}: CreateClusterModalProps) {
  const [name, setName] = React.useState("");
  const [accounts, setAccounts] = React.useState<PlatformAccount[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    getPlatformAccountsAction(workspaceId).then((res) => {
      if (res.data) setAccounts(res.data);
      setIsLoading(false);
    });
  }, [workspaceId]);

  if (!mounted) return null;

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!name || selectedIds.length === 0) return;

    setIsSubmitting(true);
    const res = await createAccountGroupAction(workspaceId, name, selectedIds);
    setIsSubmitting(false);

    if (res.data) {
      onCreated();
      onClose();
    } else {
      alert("Có lỗi xảy ra: " + res.error);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-10000 flex items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="bg-base-200 border border-foreground/10 rounded-xl w-full max-w-2xl h-fit max-h-[90vh] flex flex-col glass-shadow overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-foreground/5 flex items-center justify-between bg-base-300/50 shrink-0">
          <div>
            <h2 className="m-0 text-2xl font-bold text-base-content tracking-tight">
              Tạo cụm tài khoản
            </h2>
          </div>
          <button
            className="p-2 rounded-lg text-base-content/60 hover:bg-foreground/5 hover:text-foreground transition-all"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
          <div className="mb-8">
            <label className="block text-base-content/60 mb-2.5 tracking-wide">
              Tên cụm tài khoản
            </label>
            <input
              className="w-full bg-base-300 border border-foreground/10 text-foreground px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-base-content/60/50"
              placeholder="Ví dụ: Cụm Influencers, Cụm Instagram..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-2">
            <label className="mb-4 tracking-wide flex items-center justify-between select-none">
              <span className="text-sm font-semibold text-base-content/80">Chọn tài khoản</span>
              <span className="text-primary font-bold text-sm">
                {selectedIds.length} đã chọn
              </span>
            </label>

            <div className="flex flex-col gap-2">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-base-content/60 gap-3">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">Đang tải danh sách...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="py-12 text-center text-base-content/60 border border-dashed border-foreground/10 rounded-lg">
                  <p className="text-sm">Không tìm thấy tài khoản nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={cn(
                        "group flex items-center p-3 bg-foreground/2 border border-foreground/5 rounded-lg cursor-pointer transition-all hover:bg-foreground/4 hover:border-foreground/10 select-none",
                        selectedIds.includes(acc.id) &&
                          "bg-primary/5 border-primary/30 ring-1 ring-primary/20",
                      )}
                      onClick={() => toggleAccount(acc.id)}
                    >
                      <AccountAvatar
                        avatarUrl={acc.avatar_url || acc.metadata?.avatar_url}
                        name={acc.name}
                        platform={acc.platform}
                        showPlatformIcon={true}
                        className="mr-3 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm text-base-content truncate">
                          {acc.name || acc.externalId}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 border-foreground/10 flex items-center justify-center ml-3 transition-all shrink-0",
                          selectedIds.includes(acc.id) &&
                            "bg-primary border-primary shadow-sm shadow-primary/20",
                        )}
                      >
                        {selectedIds.includes(acc.id) && (
                          <Check
                            size={12}
                            className="text-primary-content"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-foreground/5 flex items-center justify-between bg-base-300/30 shrink-0">
          <button
            className="btn btn-primary px-8 h-11 min-h-0 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!name || selectedIds.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              "Tạo cụm ngay"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
