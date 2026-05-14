'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  MoreHorizontal,
  Play,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Send,
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformAccount } from '@/domain/types/platform-account';

type MediaFile = {
  id: string;
  url: string;
  type: 'image' | 'video';
  status: 'uploading' | 'transcoding' | 'done' | 'error' | 'transcode_error';
  progress?: number;
};

type PostPreviewPanelProps = {
  content: string;
  mediaFiles: MediaFile[];
  activePlatforms: ('facebook' | 'instagram')[];
  accounts: PlatformAccount[];
};

export function PostPreviewPanel({ content, mediaFiles, activePlatforms, accounts }: PostPreviewPanelProps) {
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'instagram'>(
    activePlatforms.includes('facebook') ? 'facebook' : 'instagram'
  );

  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const prevAccountsRef = useRef<string[]>([]);

  const fbAccounts = accounts.filter(a => a.platform.toLowerCase() === 'facebook');
  const igAccounts = accounts.filter(a => a.platform.toLowerCase() === 'instagram');

  const currentAccounts = activePlatform === 'facebook' ? fbAccounts : igAccounts;

  // Sync behavior: auto-activate newly added account
  useEffect(() => {
    const currentIds = accounts.map(a => a.id);
    const addedId = currentIds.find(id => !prevAccountsRef.current.includes(id));
    
    if (addedId) {
      const addedAccount = accounts.find(a => a.id === addedId);
      if (addedAccount) {
        setActivePlatform(addedAccount.platform.toLowerCase() as 'facebook' | 'instagram');
        setActiveAccountId(addedId);
      }
    }
    
    prevAccountsRef.current = currentIds;
  }, [accounts]);

  useEffect(() => {
    if (activePlatforms.length > 0 && !activePlatforms.includes(activePlatform)) {
      setActivePlatform(activePlatforms[0]);
    }
  }, [activePlatforms, activePlatform]);

  useEffect(() => {
    if (currentAccounts.length > 0 && (!activeAccountId || !currentAccounts.find(a => a.id === activeAccountId))) {
      setActiveAccountId(currentAccounts[0].id);
    }
  }, [currentAccounts, activeAccountId]);

  const activeAccount = currentAccounts.find(a => a.id === activeAccountId);
  const doneMedia = mediaFiles.filter(f => f.status === 'done');

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Level 1: Platform Tabs (Segmented Control) */}
      <div className="flex items-center bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-xl p-1 h-[42px]">
        <button
          onClick={() => setActivePlatform('facebook')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[12px] font-bold h-full rounded-lg transition-all",
            activePlatform === 'facebook' 
              ? "bg-[#1e2230] text-[#4f7cff] shadow-sm" 
              : "text-[#7a7a9a] hover:text-white"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
          Facebook
          <span className="bg-[#1877F2]/10 text-[#1877F2] text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-mono">
            {fbAccounts.length}
          </span>
        </button>
        <button
          onClick={() => setActivePlatform('instagram')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[12px] font-bold h-full rounded-lg transition-all",
            activePlatform === 'instagram' 
              ? "bg-[#1e2230] text-[#E1306C] shadow-sm" 
              : "text-[#7a7a9a] hover:text-white"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-[#E1306C]" />
          Instagram
          <span className="bg-[#E1306C]/10 text-[#E1306C] text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-mono">
            {igAccounts.length}
          </span>
        </button>
      </div>

      {/* Level 2: Account Sub-tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none min-h-[36px]">
        {currentAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 w-full opacity-40">
            <span className="text-2xl mb-1">👆</span>
            <span className="text-[12px] font-medium text-white">Chưa có tài khoản {activePlatform === 'facebook' ? 'Facebook' : 'Instagram'}</span>
            <span className="text-[10px] text-[#7a7a9a]">Vui lòng chọn tài khoản ở cột bên trái</span>
          </div>
        ) : (
          currentAccounts.map(acc => {
            const isActive = activeAccountId === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setActiveAccountId(acc.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border shrink-0",
                  isActive 
                    ? "bg-[#4f7cff]/10 border-[#4f7cff] text-[#4f7cff]" 
                    : "bg-transparent border-[#2a2f42] text-[#7a7a9a] hover:border-[#4f7cff]/50"
                )}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-[#252836] shrink-0">
                  {acc.avatar_url ? (
                    <img src={acc.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-white font-bold">{acc.name.charAt(0)}</span>
                  )}
                </div>
                {acc.name}
              </button>
            );
          })
        )}
      </div>

      {/* Post Mock */}
      {currentAccounts.length > 0 && activeAccount ? (
        <div className="bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-xl overflow-hidden shadow-2xl">
          {activePlatform === 'facebook' ? (
            <FacebookMock account={activeAccount} content={content} media={doneMedia} />
          ) : (
            <InstagramMock account={activeAccount} content={content} media={doneMedia} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function FacebookMock({ account, content, media }: { account: PlatformAccount; content: string; media: MediaFile[] }) {
  return (
    <div className="bg-white text-[#1c1e21] font-sans">
      <div className="p-3 pb-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-[18px] overflow-hidden shrink-0">
            {account.avatar_url ? <img src={account.avatar_url} className="w-full h-full object-cover" /> : account.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="text-[14px] font-bold leading-tight">{account.name}</div>
            <div className="text-[11px] text-[#65676B] flex items-center gap-1 mt-0.5">
              Vừa xong <span className="text-[8px]">·</span> <Globe size={11} />
            </div>
          </div>
          <MoreHorizontal size={20} className="text-[#65676B] ml-auto" />
        </div>

        {/* Content */}
        <div className="text-[13px] leading-[1.65] mb-3 whitespace-pre-wrap break-words">
          {content || <span className="text-[#65676B] italic">Nội dung bài viết...</span>}
        </div>
      </div>

      {/* Media Placeholder */}
      <div className="w-full aspect-[4/3] bg-[#f0f2f5] flex flex-col items-center justify-center border-y border-[#e4e6eb] relative overflow-hidden">
        {media.length > 0 ? (
           media[0].type === 'video' ? (
             <video src={media[0].url} className="w-full h-full object-contain" />
           ) : (
             <img src={media[0].url} className="w-full h-full object-cover" />
           )
        ) : (
           <div className="flex flex-col items-center text-[#65676B]">
             <span className="text-[24px] mb-1">🖼️</span>
             <span className="text-[12px] font-bold">{media.length > 0 ? `${media.length} ảnh` : 'Media Area (4:3)'}</span>
             {media.length === 0 && <span className="text-[11px] opacity-60">Chưa có ảnh/video</span>}
           </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-3 border-t border-[#e4e6eb] mt-1">
        <div className="flex justify-between py-2.5">
          <button className="flex-1 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#65676B]">
            <ThumbsUp size={18} /> Thích
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#65676B]">
            <MessageCircle size={18} /> Bình luận
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#65676B]">
            <Share2 size={18} /> Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}

function InstagramMock({ account, content, media }: { account: PlatformAccount; content: string; media: MediaFile[] }) {
  const renderCaption = () => {
    if (!content) return <span className="text-[#8e8e8e] italic">Nhập caption...</span>;
    
    const words = content.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('#') || word.startsWith('@')) {
        return <span key={idx} className="text-[#6aadff]">{word}</span>;
      }
      if (/https?:\/\/[^\s]+/.test(word)) {
        return <span key={idx} className="text-[#f5a623] inline-flex items-center gap-0.5">⚠️ {word}</span>;
      }
      return <span key={idx}>{word}</span>;
    });
  };

  return (
    <div className="bg-white text-black font-sans pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white font-bold p-[1.5px]">
            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden flex items-center justify-center bg-[#252836]">
              {account.avatar_url ? <img src={account.avatar_url} className="w-full h-full object-cover" /> : account.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="text-[13px] font-bold">{account.username || account.name.replace(/\s/g, '').toLowerCase()}</div>
        </div>
        <MoreHorizontal size={20} />
      </div>

      {/* Media Area (1:1) */}
      <div className="w-full aspect-square bg-[#f8f8f8] flex items-center justify-center border-y border-[#efefef] relative overflow-hidden">
        {media.length > 0 ? (
          media[0].type === 'video' ? (
            <video src={media[0].url} className="w-full h-full object-cover" />
          ) : (
            <img src={media[0].url} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center text-[#8e8e8e]">
             <span className="text-[24px] mb-1">📸</span>
             <span className="text-[12px] font-bold">Square Media (1:1)</span>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="p-3 pb-2 flex justify-between items-center">
        <div className="flex gap-4">
          <Heart size={24} strokeWidth={1.5} />
          <MessageCircle size={24} strokeWidth={1.5} style={{ transform: 'scaleX(-1)' }} />
          <Send size={24} strokeWidth={1.5} />
        </div>
        <Bookmark size={24} strokeWidth={1.5} />
      </div>

      {/* Caption Section */}
      <div className="px-3 text-[13px] leading-[1.4]">
        <div className="word-break whitespace-pre-wrap">
          <span className="font-bold mr-1.5">{account.username || account.name.replace(/\s/g, '').toLowerCase()}</span>
          {renderCaption()}
        </div>
      </div>
    </div>
  );
}
