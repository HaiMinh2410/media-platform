'use client';

import React, { useState } from 'react';
import { Globe, Camera, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type PostPreviewProps = {
  content: string;
  mediaUrls: string[];
  platform: 'facebook' | 'instagram';
};

export function PostPreview({ content, mediaUrls, platform }: PostPreviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Live Preview</h3>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800 rounded-md">
            Mobile Feed
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[360px] aspect-[9/19.5] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-950 rounded-full" />
        </div>

        {/* Content Area */}
        <div className="h-full w-full bg-white pt-10 overflow-y-auto hide-scrollbar">
          {platform === 'instagram' ? (
            <InstagramPreview content={content} mediaUrls={mediaUrls} />
          ) : (
            <FacebookPreview content={content} mediaUrls={mediaUrls} />
          )}
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ content, mediaUrls }: { content: string; mediaUrls: string[] }) {
  return (
    <div className="text-black bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]">
            <div className="w-full h-full rounded-full bg-white p-[1px]">
              <div className="w-full h-full rounded-full bg-gray-200" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold">your_account</p>
            <p className="text-[9px] text-gray-500 -mt-0.5">Original Audio</p>
          </div>
        </div>
        <MoreHorizontal size={16} className="text-gray-400" />
      </div>

      {/* Media */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {mediaUrls.length > 0 ? (
          <img src={mediaUrls[0]} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <Camera size={48} className="text-gray-200" />
        )}
        {mediaUrls.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] px-2 py-1 rounded-full backdrop-blur-md">
            1/{mediaUrls.length}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart size={22} className="hover:text-red-500 transition-colors" />
            <MessageCircle size={22} />
            <Share2 size={22} />
          </div>
          <Bookmark size={22} />
        </div>
        
        <div className="space-y-1">
          <p className="text-[11px] font-bold">999 likes</p>
          <p className="text-[12px] leading-tight">
            <span className="font-bold mr-1">your_account</span>
            {content || 'Your caption will appear here...'}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-tight mt-1">2 hours ago</p>
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ content, mediaUrls }: { content: string; mediaUrls: string[] }) {
  return (
    <div className="text-[#1c1e21] bg-[#f0f2f5] min-h-full">
      <div className="bg-white p-3 space-y-3 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div>
              <p className="text-[14px] font-bold leading-tight">Your Page Name</p>
              <p className="text-[12px] text-gray-500 leading-tight">Just now · 🌍</p>
            </div>
          </div>
          <MoreHorizontal size={20} className="text-gray-500" />
        </div>

        {/* Content */}
        <p className="text-[14px] whitespace-pre-wrap">
          {content || 'What\'s on your mind?'}
        </p>
      </div>

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="bg-white border-y border-gray-200">
           <img src={mediaUrls[0]} alt="Post" className="w-full object-contain max-h-[400px]" />
        </div>
      )}

      {/* Actions Mock */}
      <div className="bg-white px-3 py-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white">👍</span>
          </div>
          <p className="text-[12px] text-gray-500">12</p>
        </div>
        <p className="text-[12px] text-gray-500">2 comments</p>
      </div>

      <div className="bg-white border-t border-gray-200 px-2 py-1 flex items-center justify-around">
        <button className="flex items-center gap-2 text-gray-600 font-semibold text-[13px] hover:bg-gray-100 px-4 py-1.5 rounded-md transition-colors">
          <span>👍</span> Like
        </button>
        <button className="flex items-center gap-2 text-gray-600 font-semibold text-[13px] hover:bg-gray-100 px-4 py-1.5 rounded-md transition-colors">
          <span>💬</span> Comment
        </button>
      </div>
    </div>
  );
}
