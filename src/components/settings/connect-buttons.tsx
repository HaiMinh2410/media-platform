'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type ConnectButtonsProps = {
  workspaceId: string;
};

export function ConnectButtons({ workspaceId }: ConnectButtonsProps) {
  const handleConnectFacebook = () => {
    window.location.href = `/api/auth/meta/connect?workspaceId=${workspaceId}`;
  };

  const handleConnectInstagram = () => {
    // The same Meta OAuth flow will authenticate Instagram Professional accounts
    window.location.href = `/api/auth/meta/connect?workspaceId=${workspaceId}`;
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      <Card 
        className="h-full bg-white/[0.02] border-white/5"
        title="Facebook" 
        description="Connect your Facebook Pages to manage messages and automation."
      >
        <div className="flex justify-center items-center h-24 mb-6">
          <Icon name="facebook" size={60} className="text-[#1877F2] drop-shadow-[0_0_10px_rgba(24,119,242,0.3)]" />
        </div>
        <Button onClick={handleConnectFacebook} fullWidth className="mt-auto">
          Connect Page
        </Button>
      </Card>

      <Card 
        className="h-full bg-white/[0.02] border-white/5"
        title="Instagram" 
        description="Manage your Instagram Business messages and automated replies."
      >
        <div className="flex justify-center items-center h-24 mb-6">
          <Icon name="instagram-filled" size={60} className="text-[#E4405F] drop-shadow-[0_0_10px_rgba(228,64,95,0.3)]" />
        </div>
        <Button onClick={handleConnectInstagram} fullWidth className="mt-auto">
          Connect IG
        </Button>
      </Card>
      
      <Card 
        className="h-full bg-white/[0.02] border-white/5 opacity-60 grayscale"
        title="TikTok" 
        description="Connect your TikTok Business accounts to stay engaged."
      >
        <div className="flex justify-center items-center h-24 mb-6">
          <Icon name="tiktok" size={60} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
        </div>
        <Button disabled fullWidth variant="outline">
          Coming Soon
        </Button>
      </Card>
    </div>
  );
}
