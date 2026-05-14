'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  MoreHorizontal,
  Play,
  Layers,
  ThumbsUp,
  MessageCircle,
  Share,
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

  const fbAccounts = accounts.filter(a => a.platform.toLowerCase() === 'facebook');
  const igAccounts = accounts.filter(a => a.platform.toLowerCase() === 'instagram');

  const currentAccounts = activePlatform === 'facebook' ? fbAccounts : igAccounts;

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
    <div className="flex flex-col gap-4 w-full">
      {/* Level 1: Platform Tabs */}
      <div className="flex items-center bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-lg h-[34px] overflow-hidden">
        <button
          onClick={() => setActivePlatform('facebook')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[12px] font-bold h-full transition-colors",
            activePlatform === 'facebook' ? "bg-[#1e2230] text-[#4f7cff] border-b-2 border-[#4f7cff]" : "text-[#7a7a9a] hover:bg-[#1a1c23]"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
          Facebook <span className="opacity-70">[{fbAccounts.length}]</span>
        </button>
        <button
          onClick={() => setActivePlatform('instagram')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[12px] font-bold h-full transition-colors",
            activePlatform === 'instagram' ? "bg-[#1e2230] text-[#E1306C] border-b-2 border-[#E1306C]" : "text-[#7a7a9a] hover:bg-[#1a1c23]"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-[#E1306C]" />
          Instagram <span className="opacity-70">[{igAccounts.length}]</span>
        </button>
      </div>

      {/* Level 2: Sub-tabs */}
      <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
        {currentAccounts.length === 0 ? (
          <div className="text-[12px] text-[#7a7a9a]">Chưa có tài khoản {activePlatform === 'facebook' ? 'Facebook' : 'Instagram'} nào được chọn.</div>
        ) : (
          currentAccounts.map(acc => {
            const isActive = activeAccountId === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setActiveAccountId(acc.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-[14px] text-[11px] font-medium transition-colors border",
                  isActive 
                    ? "bg-[#2d5be3]/20 border-[#4f7cff] text-[#4f7cff]" 
                    : "bg-transparent border-[#2a2f42] text-[#7a7a9a] hover:text-white"
                )}
              >
                <div className="w-[14px] h-[14px] rounded-full overflow-hidden flex items-center justify-center bg-[#252836]">
                  {acc.avatar_url ? (
                    <img src={acc.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-white font-bold">{acc.name.charAt(0)}</span>
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
        <div className="bg-[#161920] border-[1.5px] border-[#2a2f42] rounded-xl overflow-hidden mt-2">
          {activePlatform === 'facebook' ? (
            <FacebookMock account={activeAccount} content={content} media={doneMedia} />
          ) : (
            <InstagramMock account={activeAccount} content={content} media={doneMedia} />
          )}
        </div>
      ) : (
        <div className="h-[200px] border-[1.5px] border-[#2a2f42] border-dashed rounded-xl flex items-center justify-center text-[#7a7a9a] mt-2">
          <span className="text-[13px]">Chọn tài khoản để xem trước</span>
        </div>
      )}
    </div>
  );
}

function FacebookMock({ account, content, media }: { account: PlatformAccount; content: string; media: MediaFile[] }) {
  const renderContent = () => {
    const lines = content.split('\n');
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {line}
        {idx !== lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="bg-white text-[#1c1e21] font-sans">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-[18px] overflow-hidden shrink-0">
            {account.avatar_url ? <img src={account.avatar_url} className="w-full h-full object-cover" /> : account.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[14px] font-bold leading-tight">{account.name}</div>
            <div className="text-[12px] text-[#65676B] flex items-center gap-1">
              Vừa xong <span className="text-[8px]">·</span> <Globe size={12} />
            </div>
          </div>
          <MoreHorizontal size={20} className="text-[#65676B] ml-auto" />
        </div>

        {/* Content */}
        <div className="text-[14px] leading-[1.4] mb-3 whitespace-pre-wrap word-break">
          {content ? renderContent() : <span className="text-[#65676B] italic">Nội dung bài viết...</span>}
        </div>
      </div>

      {/* Media Placeholder */}
      <div className="w-full aspect-[4/3] bg-[#f0f2f5] flex flex-col items-center justify-center border-y border-[#e4e6eb] relative overflow-hidden">
        {media.length > 0 ? (
           media[0].type === 'video' ? (
             <div className="w-full h-full relative group">
               <video src={media[0].url} className="w-full h-full object-contain" />
               <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                 <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/50">
                   <Play fill="white" className="text-white ml-1" size={24} />
                 </div>
               </div>
             </div>
           ) : (
             <img src={media[0].url} className="w-full h-full object-cover" />
           )
        ) : (
          <>
            <span className="text-[24px] mb-2">🖼️</span>
            <span className="text-[13px] text-[#65676B] font-medium">[ Media Area 4:3 ]</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-3">
        <div className="flex justify-between py-2 border-b border-[#e4e6eb]">
          <div className="flex items-center gap-1">
            <div className="w-[18px] h-[18px] rounded-full bg-[#1877F2] flex items-center justify-center text-white text-[10px]">👍</div>
            <span className="text-[13px] text-[#65676B]">12</span>
          </div>
          <div className="text-[13px] text-[#65676B] flex gap-3">
            <span>2 bình luận</span>
            <span>1 chia sẻ</span>
          </div>
        </div>
        <div className="flex justify-between py-1">
          <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[14px] font-semibold text-[#65676B] hover:bg-[#f0f2f5] rounded-md transition-colors">
            <ThumbsUp size={18} /> Thích
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[14px] font-semibold text-[#65676B] hover:bg-[#f0f2f5] rounded-md transition-colors">
            <MessageCircle size={18} /> Bình luận
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[14px] font-semibold text-[#65676B] hover:bg-[#f0f2f5] rounded-md transition-colors">
            <Share size={18} /> Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}

function InstagramMock({ account, content, media }: { account: PlatformAccount; content: string; media: MediaFile[] }) {
  const renderContentWithHighlights = () => {
    if (!content) return <span className="text-slate-400 italic">Nhập nội dung...</span>;
    const words = content.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('#') || word.startsWith('@')) {
        return <span key={idx} className="text-[#00376b]">{word}</span>;
      }
      if (/https?:\/\/[^\s]+/.test(word)) {
        return <span key={idx} className="text-[#f5a623] inline-flex items-center gap-1">⚠️ {word}</span>;
      }
      return <span key={idx}>{word}</span>;
    });
  };

  return (
    <div className="bg-white text-black font-sans pb-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="w-[32px] h-[32px] rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]">
            <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white flex items-center justify-center text-[14px] font-bold text-[#E1306C]">
              {account.avatar_url ? <img src={account.avatar_url} className="w-full h-full object-cover" /> : account.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="text-[13px] font-semibold">{account.username || account.name.replace(/\s/g, '').toLowerCase()}</div>
        </div>
        <MoreHorizontal size={18} />
      </div>

      {/* Media */}
      <div className="w-full aspect-square bg-[#f8f8f8] flex items-center justify-center relative overflow-hidden">
        {media.length > 0 ? (
          media[0].type === 'video' ? (
            <div className="w-full h-full relative">
              <video src={media[0].url} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
                <Play className="text-white fill-white" size={12} />
              </div>
            </div>
          ) : (
            <img src={media[0].url} className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-[13px] text-[#8e8e8e] font-medium">[ Media 1:1 ]</span>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pb-1 flex justify-between items-center">
        <div className="flex gap-4">
          <Heart size={24} className="hover:opacity-50 cursor-pointer" />
          <MessageCircle size={24} className="hover:opacity-50 cursor-pointer" style={{ transform: 'scaleX(-1)' }} />
          <Send size={24} className="hover:opacity-50 cursor-pointer" />
        </div>
        <Bookmark size={24} className="hover:opacity-50 cursor-pointer" />
      </div>

      {/* Caption */}
      <div className="px-3 text-[13px]">
        <div className="font-semibold mb-1">123 lượt thích</div>
        <div className="leading-[1.4] whitespace-pre-wrap word-break">
          <span className="font-semibold mr-1">{account.username || account.name.replace(/\s/g, '').toLowerCase()}</span>
          {renderContentWithHighlights()}
        </div>
      </div>
    </div>
  );
}
