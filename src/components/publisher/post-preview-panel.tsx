'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/icon';

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
};

export function PostPreviewPanel({ content, mediaFiles, activePlatforms }: PostPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram'>(
    activePlatforms.includes('instagram') ? 'instagram' : 'facebook'
  );

  const doneMedia = mediaFiles.filter(f => f.status === 'done');

  return (
    <div className="flex flex-col gap-6 w-full max-w-[400px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Live Preview</h3>
        
        {/* Modern Tabs */}
        <div className="flex bg-slate-900/50 backdrop-blur-xl rounded-xl p-1 border border-white/5 relative">
          <button
            onClick={() => setActiveTab('facebook')}
            className={cn(
              "relative px-4 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-2",
              activeTab === 'facebook' ? "text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Icon name="facebook" size={14} />
            FB
            {activeTab === 'facebook' && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('instagram')}
            className={cn(
              "relative px-4 py-1.5 text-xs font-bold transition-colors z-10 flex items-center gap-2",
              activeTab === 'instagram' ? "text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Icon name="instagram" size={14} />
            IG
            {activeTab === 'instagram' && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Phone Frame */}
      <div className="relative mx-auto w-full aspect-[9/18.5] bg-slate-950 rounded-[3.5rem] border-[12px] border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10 group">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-900 rounded-b-3xl z-50 flex items-center justify-center">
          <div className="w-10 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Inner Content Area */}
        <div className="h-full w-full bg-white overflow-y-auto hide-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'facebook' ? (
              <motion.div
                key="fb"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <FacebookPreview content={content} media={doneMedia} />
              </motion.div>
            ) : (
              <motion.div
                key="ig"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <InstagramPreview content={content} media={doneMedia} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <p className="text-center text-slate-500 text-[10px] font-medium tracking-wide uppercase">
        Mockup reflects actual mobile rendering
      </p>
    </div>
  );
}

function FacebookPreview({ content, media }: { content: string; media: MediaFile[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const truncatedContent = content.length > 250 && !isExpanded 
    ? content.slice(0, 250) + "..." 
    : content;

  return (
    <div className="text-[#1c1e21] bg-[#f0f2f5] min-h-full font-sans">
      <div className="bg-white p-3 space-y-3 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight">Your Page Name</p>
              <div className="flex items-center gap-1">
                <p className="text-[12px] text-slate-500 font-medium">Just now</p>
                <span className="text-slate-500 text-[10px]">·</span>
                <Globe size={10} className="text-slate-500" />
              </div>
            </div>
          </div>
          <MoreHorizontal size={20} className="text-slate-500 cursor-pointer" />
        </div>

        {/* Content */}
        <div className="text-[15px] leading-[1.33] whitespace-pre-wrap">
          {truncatedContent || <span className="text-slate-400 italic">What's on your mind?</span>}
          {content.length > 250 && !isExpanded && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="ml-1 font-bold hover:underline text-slate-600"
            >
              See More
            </button>
          )}
        </div>
      </div>

      {/* Media Rendering */}
      {media.length > 0 && (
        <div className="bg-white border-y border-slate-200 relative overflow-hidden">
          {media.length === 1 ? (
            <div className="relative group">
              {media[0].type === 'video' ? (
                <div className="relative">
                  <video src={media[0].url} className="w-full object-contain max-h-[450px]" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/50">
                      <Play fill="white" className="text-white ml-1" size={24} />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={media[0].url} alt="FB Post" className="w-full object-contain max-h-[450px]" />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[2px]">
              {media.slice(0, 4).map((m, idx) => (
                <div key={m.id} className="relative aspect-square">
                  {m.type === 'video' ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center relative">
                      <Play className="text-slate-400" size={20} />
                    </div>
                  ) : (
                    <img src={m.url} alt={`FB ${idx}`} className="w-full h-full object-cover" />
                  )}
                  {idx === 3 && media.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                      +{media.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reactions Bar Mockup */}
      <div className="bg-white px-3 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-1 ring-white">
              <span className="text-[8px] leading-none">👍</span>
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-1 ring-white">
              <span className="text-[8px] leading-none">❤️</span>
            </div>
          </div>
          <p className="text-[13px] text-slate-500 ml-1">12</p>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-slate-500">
          <span>2 comments</span>
          <span>1 share</span>
        </div>
      </div>

      {/* Action Buttons Mockup */}
      <div className="bg-white px-1 py-1 flex items-center justify-around">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px] hover:bg-slate-100 px-3 py-2 rounded-md flex-1 justify-center transition-colors">
          <span>👍</span> Like
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px] hover:bg-slate-100 px-3 py-2 rounded-md flex-1 justify-center transition-colors">
          <span>💬</span> Comment
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-[13px] hover:bg-slate-100 px-3 py-2 rounded-md flex-1 justify-center transition-colors">
          <span>↪️</span> Share
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ content, media }: { content: string; media: MediaFile[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const truncatedContent = content.length > 125 && !isExpanded 
    ? content.slice(0, 125) 
    : content;

  return (
    <div className="text-black bg-white min-h-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]">
            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
              <div className="w-full h-full rounded-full bg-slate-100" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold leading-none">your_account</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-none">Original Audio</p>
          </div>
        </div>
        <MoreHorizontal size={18} className="text-slate-900" />
      </div>

      {/* Media Feed */}
      <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden">
        {media.length > 0 ? (
          <>
            {media[0].type === 'video' ? (
               <div className="w-full h-full relative group">
                  <video src={media[0].url} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
                    <Play className="text-white fill-white" size={12} />
                  </div>
               </div>
            ) : (
              <img src={media[0].url} alt="IG Feed" className="w-full h-full object-cover" />
            )}
            
            {media.length > 1 && (
              <>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  1/{media.length}
                </div>
                <div className="absolute top-10 right-3 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
                  <Layers className="text-white" size={14} />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-10">
            <Icon name="instagram" size={64} />
            <p className="text-xs font-bold uppercase tracking-widest">Feed Preview</p>
          </div>
        )}
      </div>

      {/* IG Actions */}
      <div className="px-3 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart size={24} className="hover:scale-110 active:scale-95 transition-transform" />
            <MessageCircle size={24} />
            <Share2 size={24} />
          </div>
          <Bookmark size={24} />
        </div>
        
        {/* Carousel Indicators */}
        {media.length > 1 && (
          <div className="flex justify-center gap-1">
            {media.map((_, i) => (
              <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-blue-500" : "bg-slate-200")} />
            ))}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[13px] font-bold">12,345 likes</p>
          <div className="text-[13px] leading-[1.4] text-slate-900">
            <span className="font-bold mr-2">your_account</span>
            {truncatedContent ? (
              truncatedContent.split(/(\s+)/).map((part, i) => 
                (part.startsWith('#') || part.startsWith('@')) ? (
                  <span key={i} className="text-blue-900">{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )
            ) : (
              <span className="text-slate-400 italic">No caption yet...</span>
            )}
            {content.length > 125 && !isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-slate-500 ml-1 hover:text-black transition-colors"
              >
                ... more
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-tight mt-2 font-medium">Just now</p>
        </div>
      </div>
    </div>
  );
}
