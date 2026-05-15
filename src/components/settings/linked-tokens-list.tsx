'use client';

import React from 'react';
import { Key, User, Calendar, RefreshCw, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  metaToken?: TokenInfo | null;
  tiktokToken?: TokenInfo | null;
}

interface LinkedTokensListProps {
  accounts: LinkedAccount[];
}

export function LinkedTokensList({ accounts }: LinkedTokensListProps) {
  const [showTokens, setShowTokens] = React.useState<Record<string, boolean>>({});

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const toggleToken = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskToken = (token: string) => {
    if (!token) return 'N/A';
    return `${token.substring(0, 12)}****************${token.substring(token.length - 8)}`;
  };

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center bg-foreground/[0.02] border border-dashed border-foreground/10 rounded-2xl">
        <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="text-foreground-tertiary" size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-1">Chưa có tài khoản nào được liên kết</h3>
        <p className="text-foreground-tertiary text-sm">
          Kết nối tài khoản Facebook, Instagram hoặc TikTok để xem thông tin token tại đây.
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

      <div className="grid grid-cols-1 gap-4">
        {accounts.map((account) => {
          const token = account.metaToken || account.tiktokToken;
          const isExpired = token ? new Date(token.expiresAt) < new Date() : false;
          
          return (
            <div 
              key={account.id}
              className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-5 hover:bg-foreground/[0.04] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-foreground/5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold",
                    account.platform === 'facebook' ? "bg-[#1877F2]" : 
                    account.platform === 'instagram' ? "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" : 
                    "bg-black"
                  )}>
                    {account.platform[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground leading-tight">
                      {account.platform_user_name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-foreground-tertiary">
                      <User size={12} />
                      ID: <code className="bg-foreground/5 px-1 rounded text-primary">{account.platform_user_id}</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {token ? (
                    isExpired ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-error bg-error/10 px-2 py-1 rounded-full border border-error/20">
                        <AlertCircle size={10} /> Expired
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-tertiary bg-foreground/5 px-2 py-1 rounded-full border border-foreground/10">
                      No Token
                    </span>
                  )}
                </div>
              </div>

              {token ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-tertiary flex items-center gap-1.5">
                        <Key size={12} /> Access Token
                      </label>
                      {copiedId === account.id && (
                        <span className="text-[10px] font-bold text-success animate-in fade-in slide-in-from-right-1">
                          Copied!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 group">
                      <div 
                        onClick={() => copyToClipboard(token.token, account.id)}
                        className={cn(
                          "text-xs bg-foreground/5 p-2 rounded-lg flex-1 overflow-x-auto whitespace-nowrap border border-foreground/5 text-foreground-secondary cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all hide-scrollbar font-mono",
                          copiedId === account.id && "border-success/50 bg-success/[0.02]"
                        )}
                      >
                        {showTokens[account.id] ? token.token : maskToken(token.token)}
                      </div>
                      <button 
                        onClick={() => toggleToken(account.id)}
                        className="p-2 hover:bg-foreground/5 rounded-lg text-foreground-tertiary hover:text-primary transition-colors shrink-0"
                        title={showTokens[account.id] ? "Ẩn" : "Hiện"}
                      >
                        {showTokens[account.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-tertiary flex items-center gap-1.5">
                      <Calendar size={12} /> Hết hạn (Expires)
                    </label>
                    <div className={cn(
                      "text-sm font-medium px-2 py-1.5 rounded-lg border flex items-center gap-2",
                      isExpired ? "bg-error/5 border-error/20 text-error" : "bg-foreground/5 border-foreground/5 text-foreground-secondary"
                    )}>
                      {format(new Date(token.expiresAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground-tertiary flex items-center gap-1.5">
                      <RefreshCw size={12} /> Cập nhật cuối
                    </label>
                    <div className="text-sm font-medium bg-foreground/5 border border-foreground/5 px-2 py-1.5 rounded-lg text-foreground-secondary">
                      {format(new Date(token.updatedAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-foreground-tertiary italic p-3 bg-foreground/[0.01] border border-dashed border-foreground/5 rounded-xl">
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
