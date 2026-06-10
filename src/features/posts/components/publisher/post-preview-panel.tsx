'use client';

import { cn } from "@shared/lib";
import { SlidingTabs } from "@shared/ui";

import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Send,
  Bookmark,
} from "lucide-react";
import { PlatformAccount } from "@features/settings";

type MediaFile = {
  id: string;
  url: string;
  type: "image" | "video";
  status: "uploading" | "transcoding" | "done" | "error" | "transcode_error";
  progress?: number;
};

type PostPreviewPanelProps = {
  content: string;
  mediaFiles: MediaFile[];
  activePlatforms: ("facebook" | "instagram")[];
  accounts: PlatformAccount[];
};

export function PostPreviewPanel({
  content,
  mediaFiles,
  activePlatforms,
  accounts,
}: PostPreviewPanelProps) {
  const [activePlatform, setActivePlatform] = useState<
    "facebook" | "instagram"
  >(activePlatforms.includes("facebook") ? "facebook" : "instagram");

  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const prevAccountsRef = useRef<string[]>([]);

  const fbAccounts = accounts.filter(
    (a) => a.platform.toLowerCase() === "facebook",
  );
  const igAccounts = accounts.filter(
    (a) => a.platform.toLowerCase() === "instagram",
  );

  const currentAccounts =
    activePlatform === "facebook" ? fbAccounts : igAccounts;

  // Sync behavior: auto-activate newly added account
  useEffect(() => {
    const currentIds = accounts.map((a) => a.id);
    const addedId = currentIds.find(
      (id) => !prevAccountsRef.current.includes(id),
    );

    if (addedId) {
      const addedAccount = accounts.find((a) => a.id === addedId);
      if (addedAccount) {
        setActivePlatform(
          addedAccount.platform.toLowerCase() as "facebook" | "instagram",
        );
        setActiveAccountId(addedId);
      }
    }

    prevAccountsRef.current = currentIds;
  }, [accounts]);

  useEffect(() => {
    if (
      activePlatforms.length > 0 &&
      !activePlatforms.includes(activePlatform)
    ) {
      setActivePlatform(activePlatforms[0]);
    }
  }, [activePlatforms, activePlatform]);

  useEffect(() => {
    if (
      currentAccounts.length > 0 &&
      (!activeAccountId ||
        !currentAccounts.find((a) => a.id === activeAccountId))
    ) {
      setActiveAccountId(currentAccounts[0].id);
    }
  }, [currentAccounts, activeAccountId]);

  const activeAccount = currentAccounts.find((a) => a.id === activeAccountId);
  const doneMedia = mediaFiles.filter((f) => f.status === "done");

  const tabItems = [
    {
      value: "facebook" as const,
      label: (
        <span className="flex items-center gap-2">
          Facebook
          <span className={cn(
            "badge badge-sm font-mono border-0 transition-colors",
            activePlatform === "facebook" ? "bg-white/20 text-white" : "bg-facebook/10 text-facebook"
          )}>
            {fbAccounts.length}
          </span>
        </span>
      ),
      activeBgClass: "bg-facebook",
      activeTextClass: "text-white",
    },
    {
      value: "instagram" as const,
      label: (
        <span className="flex items-center gap-2">
          Instagram
          <span className={cn(
            "badge badge-sm font-mono border-0 transition-colors",
            activePlatform === "instagram" ? "bg-white/20 text-white" : "bg-instagram/10 text-instagram"
          )}>
            {igAccounts.length}
          </span>
        </span>
      ),
      activeBgClass: "bg-instagram",
      activeTextClass: "text-white",
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Level 1: Platform Tabs (Segmented Control) */}
      <SlidingTabs
        items={tabItems}
        activeValue={activePlatform}
        onChange={setActivePlatform}
        fullWidth
        size="sm"
        rounded="rounded-full"
        layoutId="previewPlatformTabs"
      />

      {/* Level 2: Account Sub-tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar min-h-9">
        {currentAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 w-full opacity-40">
            <span className="text-2xl mb-1">👆</span>
            <span className="text-xs font-medium text-base-content">
              Chưa có tài khoản{" "}
              {activePlatform === "facebook" ? "Facebook" : "Instagram"}
            </span>
            <span className="text-2xs text-base-content/40">
              Vui lòng chọn tài khoản ở cột bên trái
            </span>
          </div>
        ) : (
          currentAccounts.map((acc) => {
            const isActive = activeAccountId === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setActiveAccountId(acc.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 cursor-pointer",
                  isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-transparent border-base-content/10 text-base-content/60 hover:border-primary/50 hover:text-primary",
                )}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-base-300 shrink-0">
                  {acc.avatar_url ? (
                    <img
                      src={acc.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xs text-base-content font-bold">
                      {acc.name.charAt(0)}
                    </span>
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
        <div className="bg-base-100 border border-base-content/10 rounded-2xl overflow-hidden shadow-2xl">
          {activePlatform === "facebook" ? (
            <FacebookMock
              account={activeAccount}
              content={content}
              media={doneMedia}
            />
          ) : (
            <InstagramMock
              account={activeAccount}
              content={content}
              media={doneMedia}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function FacebookMock({
  account,
  content,
  media,
}: {
  account: PlatformAccount;
  content: string;
  media: MediaFile[];
}) {
  return (
    <div className="text-base-content bg-base-100">
      <div className="p-3 pb-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-facebook flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {account.avatar_url ? (
              <img
                src={account.avatar_url}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              account.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold leading-tight">
              {account.name}
            </div>
            <div className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
              Vừa xong <span className="text-2xs">·</span> <Globe size={11} />
            </div>
          </div>
          <MoreHorizontal size={20} className="text-base-content/60 ml-auto cursor-pointer hover:text-base-content transition-colors" />
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap wrap-break-word">
          {content || (
            <span className="text-base-content/40 italic">Nội dung bài viết...</span>
          )}
        </div>
      </div>

      {/* Media Placeholder */}
      <div className="w-full aspect-square bg-base-200 flex flex-col items-center justify-center border-y border-base-content/10 relative overflow-hidden">
        {media.length > 0 ? (
          media[0].type === "video" ? (
            <video
              src={media[0].url}
              className="w-full h-full object-contain"
              controls
            />
          ) : (
            <img src={media[0].url} className="w-full h-full object-cover" alt="" />
          )
        ) : (
          <div className="flex flex-col items-center text-base-content/50">
            <span className="text-2xl mb-1">🖼️</span>
            <span className="text-xs font-bold">
              {media.length > 0 ? `${media.length} ảnh` : "Media Area (4:3)"}
            </span>
            {media.length === 0 && (
              <span className="text-xs text-base-content/40 mt-0.5">Chưa có ảnh/video</span>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-3 border-t border-base-content/10 mt-1">
        <div className="flex justify-between py-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-base-content/60 hover:text-base-content hover:bg-base-200/50 transition-all duration-200 cursor-pointer">
            <ThumbsUp size={18} /> Thích
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-base-content/60 hover:text-base-content hover:bg-base-200/50 transition-all duration-200 cursor-pointer">
            <MessageCircle size={18} /> Bình luận
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-base-content/60 hover:text-base-content hover:bg-base-200/50 transition-all duration-200 cursor-pointer">
            <Share2 size={18} /> Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}

function InstagramMock({
  account,
  content,
  media,
}: {
  account: PlatformAccount;
  content: string;
  media: MediaFile[];
}) {
  const renderCaption = () => {
    if (!content)
      return <span className="text-base-content/40 italic">Nhập caption...</span>;

    const words = content.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith("#") || word.startsWith("@")) {
        return (
          <span key={idx} className="text-primary font-medium hover:underline cursor-pointer">
            {word}
          </span>
        );
      }
      if (/https?:\/\/[^\s]+/.test(word)) {
        return (
          <span
            key={idx}
            className="text-warning font-medium inline-flex items-center gap-0.5"
          >
            ⚠️ {word}
          </span>
        );
      }
      return <span key={idx}>{word}</span>;
    });
  };

  return (
    <div className="bg-base-100 text-base-content pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white font-bold p-[1.5px]">
            <div className="w-full h-full rounded-full border-2 border-base-100 overflow-hidden flex items-center justify-center bg-base-300">
              {account.avatar_url ? (
                <img
                  src={account.avatar_url}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                account.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div className="text-sm font-bold">
            {account.username || account.name.replace(/\s/g, "").toLowerCase()}
          </div>
        </div>
        <MoreHorizontal size={20} className="text-base-content/60 cursor-pointer hover:text-base-content transition-colors" />
      </div>

      {/* Media Area (4:5) */}
      <div className="w-full aspect-4/5 bg-base-200 flex items-center justify-center border-y border-base-content/10 relative overflow-hidden">
        {media.length > 0 ? (
          media[0].type === "video" ? (
            <video src={media[0].url} className="w-full h-full object-cover" controls />
          ) : (
            <img src={media[0].url} className="w-full h-full object-cover" alt="" />
          )
        ) : (
          <div className="flex flex-col items-center text-base-content/50">
            <span className="text-2xl mb-1">📸</span>
            <span className="text-xs font-bold">Square Media (4:5)</span>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="p-3 pb-2 flex justify-between items-center text-base-content">
        <div className="flex gap-4">
          <Heart size={24} strokeWidth={1.5} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform" />
          <MessageCircle
            size={24}
            strokeWidth={1.5}
            className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            style={{ transform: "scaleX(-1)" }}
          />
          <Send size={24} strokeWidth={1.5} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform" />
        </div>
        <Bookmark size={24} strokeWidth={1.5} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform" />
      </div>

      {/* Caption Section */}
      <div className="px-3 text-sm leading-relaxed">
        <div className="wrap-break-word whitespace-pre-wrap">
          <span className="font-bold mr-1.5">
            {account.username || account.name.replace(/\s/g, "").toLowerCase()}
          </span>
          {renderCaption()}
        </div>
      </div>
    </div>
  );
}
