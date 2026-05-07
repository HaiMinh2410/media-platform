'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  Copy, 
  Check, 
  Terminal, 
  Key, 
  Server, 
  Code, 
  Cpu, 
  Layers, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

type WorkspaceCredentialsProps = {
  workspaceId: string;
  workspaceName: string;
  verifyToken: string;
  skipVerify: string;
};

export function WorkspaceCredentials({ 
  workspaceId, 
  workspaceName,
  verifyToken,
  skipVerify
}: WorkspaceCredentialsProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/webhooks/meta`;
    }
    return 'http://localhost:3000/api/webhooks/meta';
  };

  const copyToClipboard = async (text: string, type: 'id' | 'token' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else if (type === 'token') {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      } else if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      toast.success('Đã sao chép vào bộ nhớ tạm!');
    } catch (err) {
      toast.error('Không thể sao chép');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* CARD 1: Workspace Metadata & Credentials */}
      <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold m-0 text-foreground">Workspace Context</h3>
            <p className="text-foreground-tertiary text-xs m-0">Thông tin môi trường và thông số định danh không gian làm việc.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Workspace Name */}
          <div className="flex flex-col gap-1.5">
            <span className="text-foreground-tertiary text-2xs font-bold uppercase tracking-wider">Workspace Name</span>
            <div className="px-4 py-2.5 bg-foreground/[0.04] border border-foreground/5 rounded-xl font-medium text-sm text-foreground">
              {workspaceName}
            </div>
          </div>

          {/* Workspace ID */}
          <div className="flex flex-col gap-1.5">
            <span className="text-foreground-tertiary text-2xs font-bold uppercase tracking-wider flex justify-between items-center">
              Workspace ID
              <span className="text-[10px] text-primary lowercase italic font-normal">Sử dụng cho API requests</span>
            </span>
            <div className="flex gap-2">
              <code className="flex-1 px-4 py-2.5 bg-foreground/[0.04] border border-foreground/5 rounded-xl font-mono text-xs text-foreground-secondary select-all truncate">
                {workspaceId}
              </code>
              <button 
                onClick={() => copyToClipboard(workspaceId, 'id')}
                className="p-2.5 rounded-xl border border-foreground/10 hover:bg-foreground/5 text-foreground-secondary hover:text-foreground active:scale-95 transition-all"
                title="Sao chép Workspace ID"
              >
                {copiedId ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Environment Status */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl flex items-center justify-between">
              <span className="text-foreground-tertiary text-xs">Môi trường</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                Local Dev
              </span>
            </div>
            <div className="p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl flex items-center justify-between">
              <span className="text-foreground-tertiary text-xs">Skip Verify</span>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                skipVerify === 'true' 
                  ? "text-yellow-500 bg-yellow-500/10" 
                  : "text-foreground-tertiary bg-foreground/10"
              )}>
                {skipVerify === 'true' ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Meta Webhook Config Info */}
      <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold m-0 text-foreground">Meta Webhook Config</h3>
            <p className="text-foreground-tertiary text-xs m-0">Cấu hình Endpoint và Verify Token để liên kết với Facebook Developers.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Callback URL */}
          <div className="flex flex-col gap-1.5">
            <span className="text-foreground-tertiary text-2xs font-bold uppercase tracking-wider">Callback URL</span>
            <div className="flex gap-2">
              <code className="flex-1 px-4 py-2.5 bg-foreground/[0.04] border border-foreground/5 rounded-xl font-mono text-xs text-foreground-secondary select-all truncate">
                {getWebhookUrl()}
              </code>
              <button 
                onClick={() => copyToClipboard(getWebhookUrl(), 'url')}
                className="p-2.5 rounded-xl border border-foreground/10 hover:bg-foreground/5 text-foreground-secondary hover:text-foreground active:scale-95 transition-all"
                title="Sao chép Callback URL"
              >
                {copiedUrl ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="flex flex-col gap-1.5">
            <span className="text-foreground-tertiary text-2xs font-bold uppercase tracking-wider flex justify-between items-center">
              Verify Token
              <span className="text-[10px] text-yellow-500/80 font-normal lowercase flex items-center gap-1">
                <ShieldAlert size={10} />
                Bảo mật tuyệt đối
              </span>
            </span>
            <div className="flex gap-2">
              <input 
                type="password"
                readOnly
                value={verifyToken || 'not_configured_token_value'}
                className="flex-1 px-4 py-2.5 bg-foreground/[0.04] border border-foreground/5 rounded-xl font-mono text-xs text-foreground-secondary select-none cursor-not-allowed focus:outline-none"
              />
              <button 
                onClick={() => copyToClipboard(verifyToken || 'not_configured_token_value', 'token')}
                className="p-2.5 rounded-xl border border-foreground/10 hover:bg-foreground/5 text-foreground-secondary hover:text-foreground active:scale-95 transition-all"
                title="Sao chép Verify Token"
              >
                {copiedToken ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Tips block */}
          <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-500/80 flex items-start gap-2.5">
            <Cpu size={14} className="shrink-0 mt-0.5" />
            <p className="m-0 text-[11px] leading-relaxed">
              Dùng <strong>ngrok</strong> hoặc cloudflare tunnel để map cổng <strong>3000</strong> thành public URL nếu muốn nhận dữ liệu webhook trực tiếp từ Meta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
