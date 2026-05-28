import React from "react";
import { cn } from "@shared/lib/utils";

interface FilterGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterGroup({ children, className }: FilterGroupProps) {
  // Chuyển children thành mảng và loại bỏ các phần tử falsy (null, undefined, false)
  const childrenArray = React.Children.toArray(children).filter(Boolean);

  return (
    <div
      className={cn(
        "flex items-center bg-soft border border-base-content/10 rounded-sm p-0.5 shadow-3xs shrink-0 select-none",
        className
      )}
    >
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childrenArray.length - 1 && (
            <div className="h-4 w-px bg-base-content/10 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
