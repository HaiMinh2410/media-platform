'use client';

import React, { useState } from 'react';
import { manualConnectAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export function DebugForm({ workspaceId }: { workspaceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      router.push('/dashboard/settings/accounts?success=true');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <select 
          id="platform" 
          name="platform" 
          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors"
          required
        >
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="platformId">Platform User ID (Page ID or IG ID)</Label>
        <Input 
          id="platformId" 
          name="platformId" 
          placeholder="e.g. 1183865494803444" 
          required 
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="platformName">Display Name (Optional)</Label>
        <Input 
          id="platformName" 
          name="platformName" 
          placeholder="e.g. Sully.ng" 
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">Access Token (Page Access Token recommended)</Label>
        <textarea 
          id="token" 
          name="token" 
          required 
          rows={4}
          placeholder="Paste your Meta access token here..."
          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-primary transition-colors text-xs font-mono"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} fullWidth size="lg">
        {loading ? 'Connecting...' : 'Connect Manually'}
      </Button>
    </form>
  );
}
