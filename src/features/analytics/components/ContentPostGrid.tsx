import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatMetricValue } from "../hooks/useContentInsights";

interface ContentPostGridProps {
  isPending: boolean;
  isError: boolean;
  processedPosts: any[];
  getMetricValue: (post: any) => number;
  setSelectedPost: (post: any) => void;
}

export function ContentPostGrid({
  isPending,
  isError,
  processedPosts = [],
  getMetricValue,
  setSelectedPost,
}: ContentPostGridProps) {
  return (
    <>
      {/* Media Grid */}
      {isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-foreground/5 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="w-full min-h-[300px] flex items-center justify-center border border-dashed border-foreground/10 rounded-3xl text-foreground/30 text-sm">
          Lỗi khi tải dữ liệu bài viết
        </div>
      ) : processedPosts.length === 0 ? (
        <div className="w-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-foreground/10 rounded-3xl text-foreground/30 text-sm py-12">
          <svg
            className="w-12 h-12 opacity-20 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Không tìm thấy bài viết nào phù hợp
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {processedPosts.map((post: any, index: number) => {
            const displayUrl = post.thumbnailUrl || post.mediaUrl;
            const value = getMetricValue(post);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square rounded-xl overflow-hidden border border-foreground/10 bg-foreground/5 shadow-lg group cursor-pointer"
              >
                {displayUrl ? (
                  <Image
                    src={displayUrl}
                    alt="Thumbnail"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 250px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 text-2xs font-bold text-foreground/30 tracking-widest uppercase">
                    {post.mediaType}
                  </div>
                )}

                {/* Gradient shadow */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Format icon */}
                {post.mediaType === "CAROUSEL_ALBUM" ? (
                  <div className="absolute top-3 right-3 backdrop-blur-md rounded-lg p-1.5 flex items-center justify-center text-base-content">
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </div>
                ) : post.mediaType === "VIDEO" || post.mediaType === "REELS" ? (
                  <div className="absolute top-3 right-3 backdrop-blur-md rounded-lg p-1.5 flex items-center justify-center text-base-content">
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : null}

                {/* White transparent pill badge (Image 2 style) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-base-content backdrop-blur-sm font-extrabold text-xs px-3.5 py-1.5 rounded-md select-none min-w-[55px] text-center transition-all duration-300">
                  {formatMetricValue(value)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
