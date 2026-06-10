'use client';

import React from 'react';
import { Icon } from '@shared/ui';

type ConnectButtonsProps = {
  workspaceId: string;
};

export function ConnectButtons({ workspaceId }: ConnectButtonsProps) {
  const handleConnectFacebook = () => {
    window.location.href = `/api/auth/meta/connect?workspaceId=${workspaceId}`;
  };

  const handleConnectInstagram = () => {
    window.location.href = `/api/auth/meta/connect?workspaceId=${workspaceId}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Facebook Row */}
      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-base-200/40 border border-base-content/5 hover:bg-base-200/70 transition-all duration-200">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-blue-600 to-blue-800 text-white shadow-sm shrink-0">
          <Icon name="facebook" size={26} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-base-content m-0">Facebook Pages</h4>
          <p className="text-xs text-base-content/50 m-0 truncate leading-normal">
            Manage messages and automation
          </p>
        </div>
        <button
          onClick={handleConnectFacebook}
          className="btn btn-xs btn-primary rounded-full shadow-none h-8 px-3 font-bold shrink-0"
        >
          Connect
        </button>
      </div>

      {/* Instagram Row */}
      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-base-200/40 border border-base-content/5 hover:bg-base-200/70 transition-all duration-200">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-pink-600 via-red-500 to-yellow-500 text-white shadow-sm shrink-0">
          <Icon name="instagram" size={26} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-base-content m-0">Instagram</h4>
          <p className="text-xs text-base-content/50 m-0 truncate leading-normal">
            Direct messages & automated replies
          </p>
        </div>
        <button
          onClick={handleConnectInstagram}
          className="btn btn-xs btn-primary rounded-full shadow-none h-8 px-3 font-bold shrink-0"
        >
          Connect
        </button>
      </div>

      {/* TikTok Row (Disabled) */}
      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-base-200/20 border border-base-content/5 opacity-65 shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral border border-base-content/10 text-neutral-content shadow-sm shrink-0">
          <Icon name="tiktok" size={20} className="text-neutral-content" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-base-content/60 m-0">TikTok Business</h4>
          <p className="text-xs text-base-content/40 m-0 truncate leading-normal">
            Sync video comments & messages
          </p>
        </div>
        <button
          disabled
          className="btn btn-xs btn-disabled rounded-full shadow-none h-8 px-3 font-bold shrink-0"
        >
          Soon
        </button>
      </div>
    </div>
  );
}


