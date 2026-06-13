"use client";

import { cn } from "@shared/lib";
import { AccountAvatar } from "@shared/ui";

import React from "react";
import {
  Key,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface TokenInfo {
  id: string;
  token: string;
  expiresAt: Date;
  updatedAt: Date;
}

interface LinkedAccount {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_user_name: string;
  avatarUrl?: string;
  metaToken?: TokenInfo | null;
  tiktokToken?: TokenInfo | null;
}

interface LinkedTokensListProps {
  accounts: LinkedAccount[];
}

export function LinkedTokensList({ accounts }: LinkedTokensListProps) {
  const [showTokens, setShowTokens] = React.useState<Record<string, boolean>>(
    {},
  );

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const toggleToken = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskToken = (token: string) => {
    if (!token) return "N/A";
    return `${token.substring(0, 12)}****************${token.substring(token.length - 8)}`;
  };

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center bg-foreground/2 border border-dashed border-foreground/10 rounded-2xl">
        <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="text-foreground-tertiary" size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-1">
          Chưa có tài khoản nào được liên kết
        </h3>
        <p className="text-foreground-tertiary text-sm">
          Kết nối tài khoản Facebook, Instagram hoặc TikTok để xem thông tin
          token tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Key className="text-primary" size={20} />
          Thông tin Tokens & IDs
        </h3>
        <span className="text-xs text-foreground-tertiary bg-foreground/5 px-2 py-1 rounded-md">
          {accounts.length} tài khoản đang hoạt động
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accounts.map((account) => {
          const token = account.metaToken || account.tiktokToken;
          const isExpired = token
            ? new Date(token.expiresAt) < new Date()
            : false;

          return (
            <div
              key={account.id}
              className="bg-foreground/2 border border-foreground/10 rounded-xl p-4 hover:bg-foreground/4 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pb-2 border-b border-foreground/5">
                <div className="flex items-center gap-3">
                  <AccountAvatar
                    avatarUrl={account.avatarUrl}
                    name={account.platform_user_name}
                    platform={account.platform}
                  />
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground leading-tight">
                      {account.platform_user_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-foreground-tertiary">
                      ID:{" "}
                      <code
                        onClick={() =>
                          copyToClipboard(
                            account.platform_user_id,
                            account.id + "-id",
                          )
                        }
                        className="rounded text-primary/80 hover:text-primary font-mono cursor-pointer"
                        title="Click để sao chép ID"
                      >
                        {account.platform_user_id}
                      </code>
                      {copiedId === account.id + "-id" && (
                        <span className="badge badge-soft badge-success badge-xs animate-in fade-in slide-in-from-left-1 font-bold">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {token ? (
                    isExpired ? (
                      <span className="badge badge-soft badge-error gap-1 text-2xs font-bold uppercase tracking-wider">
                        <AlertCircle size={10} /> Expired
                      </span>
                    ) : (
                      <span className="badge badge-soft badge-success gap-1 text-2xs font-bold uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    )
                  ) : (
                    <span className="badge badge-soft badge-neutral text-2xs font-bold uppercase tracking-wider">
                      No Token
                    </span>
                  )}
                </div>
              </div>

              {token ? (
                <div className="flex lg:flex-col items-center justify-between gap-4">

                  <div className="space-y-2 lg:w-full flex-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm tracking-wide text-foreground-tertiary flex items-center gap-1.5">
                        <Key size={12} /> Access Token
                      </label>
                      {copiedId === account.id + "-token" && (
                        <span className="text-2xs font-bold text-success animate-in fade-in slide-in-from-right-1">
                          Copied!
                        </span>
                      )}
                    </div>
                    <div
                      onClick={() =>
                        copyToClipboard(token.token, account.id + "-token")
                      }
                      className={cn(
                        "relative flex items-center text-xs bg-foreground/5 p-2 pr-10 rounded-md flex-1 overflow-hidden border border-foreground/5 text-foreground-secondary cursor-pointer hover:border-primary/30 hover:bg-primary/2 transition-all font-mono",
                        copiedId === account.id + "-token" &&
                          "border-success/50 bg-success/2",
                      )}
                    >
                      <div className="overflow-x-auto whitespace-nowrap hide-scrollbar flex-1">
                        {showTokens[account.id]
                          ? token.token
                          : maskToken(token.token)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleToken(account.id);
                        }}
                        className="absolute right-2 p-1.5 hover:bg-foreground/10 rounded text-foreground-tertiary hover:text-primary transition-colors shrink-0"
                        title={showTokens[account.id] ? "Ẩn" : "Hiện"}
                      >
                        {showTokens[account.id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center lg:w-full flex-1 gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-sm tracking-wide text-foreground-tertiary flex items-center gap-1.5">
                        <Calendar size={12} /> Expires
                      </label>
                      <div
                        className={cn(
                          "text-sm font-medium px-2 py-1.5 rounded-md border flex items-center gap-2",
                          isExpired
                            ? "bg-error/5 border-error/20 text-error"
                            : "bg-foreground/5 border-foreground/5 text-foreground-secondary",
                        )}
                      >
                        {format(new Date(token.expiresAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <label className="text-sm tracking-wide text-foreground-tertiary flex items-center gap-1.5">
                        <RefreshCw size={12} /> Updated
                      </label>
                      <div className="text-sm font-medium bg-foreground/5 border border-foreground/5 px-2 py-1.5 rounded-md text-foreground-secondary">
                        {format(new Date(token.updatedAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-foreground-tertiary italic p-3 bg-foreground/1 border border-dashed border-foreground/5 rounded-xl">
                  Tài khoản này chưa có thông tin token được lưu trong hệ thống.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
