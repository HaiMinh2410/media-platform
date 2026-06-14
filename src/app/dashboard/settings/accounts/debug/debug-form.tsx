'use client';

import { Button, Input, Label } from "@shared/ui";
import React, { useState, useEffect } from 'react';
import { manualConnectAction, verifyTokenAction } from './actions';
import { useRouter } from 'next/navigation';

export function DebugForm({ 
  workspaceId,
  onDirtyChange 
}: { 
  workspaceId: string;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form states to track dirty status and auto-fill
  const [platformId, setPlatformId] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [token, setToken] = useState('');

  // Token verify states
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Trigger onDirtyChange when inputs are modified
  useEffect(() => {
    const isDirty = platformId.trim().length > 0 || platformName.trim().length > 0 || token.trim().length > 0;
    onDirtyChange?.(isDirty);
  }, [platformId, platformName, token, onDirtyChange]);

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setVerifyError('Vui lòng nhập Access Token trước khi kiểm tra.');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);

    const result = await verifyTokenAction(token.trim()) as any;

    if (result?.error) {
      setVerifyError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
    } else if (result?.data) {
      setVerifyResult(result.data);
      // Auto-fill platform ID and display name if available and empty
      if (result.data.userId && !platformId) {
        setPlatformId(result.data.userId);
      }
      if (result.data.accountName && result.data.accountName !== 'Unknown' && !platformName) {
        setPlatformName(result.data.accountName);
      }
    } else {
      setVerifyError('Không nhận được phản hồi từ hệ thống xác thực.');
    }
    setVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('workspaceId', workspaceId);

    const result = await manualConnectAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onDirtyChange?.(false); // Reset dirty status on success
      router.push('/dashboard/settings/accounts?success=true');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <select 
          id="platform" 
          name="platform" 
          className="select select-bordered w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content"
          required
        >
          <option value="facebook" className="bg-base-300 text-base-content">Facebook</option>
          <option value="instagram" className="bg-base-300 text-base-content">Instagram</option>
          <option value="tiktok" className="bg-base-300 text-base-content">TikTok</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="platformId">Platform User ID (Page ID or IG ID)</Label>
        <Input 
          id="platformId" 
          name="platformId" 
          placeholder="e.g. 1183865494803444" 
          required 
          value={platformId}
          onChange={(e) => setPlatformId(e.target.value)}
          className="bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="platformName">Display Name (Optional)</Label>
        <Input 
          id="platformName" 
          name="platformName" 
          placeholder="e.g. Sully.ng" 
          value={platformName}
          onChange={(e) => setPlatformName(e.target.value)}
          className="bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">Access Token (Page Access Token recommended)</Label>
        <div className="flex flex-col gap-2">
          <textarea 
            id="token" 
            name="token" 
            required 
            rows={4}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Meta access token here..."
            className="textarea textarea-bordered w-full min-h-[90px] rounded-md text-xs font-mono bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all placeholder:text-base-content/30 text-base-content"
          />
          <button
            type="button"
            disabled={verifying || !token.trim()}
            onClick={handleVerifyToken}
            className="btn btn-xs btn-outline btn-accent self-start font-semibold cursor-pointer rounded-md flex items-center gap-1"
          >
            {verifying ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Đang xác thực...
              </>
            ) : (
              '🔍 Kiểm tra Token trước'
            )}
          </button>
        </div>
      </div>

      {/* Verify Results Panel */}
      {verifyError && (
        <div className="p-3 bg-error/5 border border-error/10 text-error rounded-lg text-xs font-medium text-left">
          ⚠️ Lỗi xác thực: {verifyError}
        </div>
      )}

      {verifyResult && (
        <div className="p-4 bg-success/5 border border-success/10 rounded-lg space-y-2.5 text-xs text-base-content/85 text-left">
          <div className="flex items-center gap-2 font-bold text-success">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
            Token Hợp lệ
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1 text-2xs font-mono border-t border-base-content/5 pt-2">
            <div>Ứng dụng: <span className="text-base-content font-semibold">{verifyResult.application}</span></div>
            <div>Tài khoản: <span className="text-base-content font-semibold">{verifyResult.accountName}</span></div>
            <div>User ID: <span className="text-base-content font-semibold">{verifyResult.userId}</span></div>
            <div>Trạng thái: <span className="text-success font-semibold">{verifyResult.isValid ? 'Active' : 'Expired'}</span></div>
            <div className="col-span-2">Hết hạn: <span className="text-base-content font-semibold">{verifyResult.expiresAt}</span></div>
          </div>
          {verifyResult.scopes && verifyResult.scopes.length > 0 && (
            <div className="mt-2 border-t border-base-content/5 pt-2">
              <div className="font-semibold text-2xs mb-1.5 text-base-content/50">Quyền hạn đã cấp (Scopes):</div>
              <div className="flex flex-wrap gap-1">
                {verifyResult.scopes.map((scope: string) => (
                  <span key={scope} className="px-1.5 py-0.5 bg-base-300 hover:bg-base-300/80 rounded text-3xs font-mono text-base-content/80 transition-colors">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-error/5 border border-error/10 text-error rounded-lg text-sm font-medium text-left">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} fullWidth size="lg">
        {loading ? 'Connecting...' : 'Connect Manually'}
      </Button>
    </form>
  );
}

