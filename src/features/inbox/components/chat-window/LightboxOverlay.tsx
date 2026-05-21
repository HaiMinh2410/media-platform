'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

type LightboxOverlayProps = {
  imageUrl: string | null;
  onClose: () => void;
};

export function LightboxOverlay({ imageUrl, onClose }: LightboxOverlayProps) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Control buttons overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center transition-all hover:bg-white/20 active:scale-95"
              title="Mở tab mới"
            >
              <ChevronRight className="-rotate-45 stroke-[2.5]" size={18} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center transition-all hover:bg-white/20 active:scale-95 border-none cursor-pointer animate-none"
              title="Đóng"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Main Image Container */}
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative max-w-full max-h-[85vh] flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt="Full size view" 
              className="max-w-full max-h-[85vh] object-contain border border-foreground/10 pointer-events-auto"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
