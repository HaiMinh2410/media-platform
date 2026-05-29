'use client';

import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@shared/lib/utils";

interface PortalTooltipProps {
  active: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
  offsetY?: number;
  showArrow?: boolean;
  position?: 'top' | 'bottom';
  align?: 'center' | 'left' | 'right';
}

export function PortalTooltip({
  active,
  anchorRef,
  children,
  className,
  offsetY = 8,
  showArrow = false,
  position = 'top',
  align = 'left', // Đặt mặc định là 'left' (translate(0%, ...)) như bạn vừa chỉnh sửa để tương thích hoàn toàn
}: PortalTooltipProps) {
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!active) return;

    const updateCoords = () => {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        const baseTop = position === 'top' 
          ? rect.top + window.scrollY 
          : rect.bottom + window.scrollY;
        
        let baseLeft = rect.left + rect.width / 2 + window.scrollX;
        if (align === 'right') {
          baseLeft = rect.right + window.scrollX;
        }

        setCoords({
          top: baseTop,
          left: baseLeft,
        });
      }
    };

    updateCoords();

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [active, anchorRef, position, align]);

  if (!active) return null;

  const transformX = align === 'center' ? '-50%' : '0%';
  const transformY = position === 'top' ? '-100%' : '0%';

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: position === 'top' ? `${coords.top - offsetY}px` : `${coords.top + offsetY}px`,
        left: `${coords.left}px`,
        transform: `translate(${transformX}, ${transformY})`,
      }}
      className={cn(
        "z-100 w-64 p-3 bg-base-100 rounded-lg border border-base-content/10 shadow-lg text-left animate-fade-in pointer-events-none",
        className
      )}
    >
      {showArrow && (
        <div 
          className={cn(
            "absolute w-2 h-2 bg-base-100 rotate-45 border-base-content/10",
            align === 'center' ? "left-1/2 -translate-x-1/2" : "left-4",
            position === 'top' 
              ? "-bottom-1 border-b border-r" 
              : "-top-1 border-t border-l"
          )} 
        />
      )}
      {children}
    </div>,
    document.body
  );
}
