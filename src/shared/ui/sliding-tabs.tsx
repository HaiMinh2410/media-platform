"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Icon } from "@shared/ui/icon";

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: LucideIcon;
  /**
   * Optional custom background class for the active sliding indicator
   * @default 'bg-primary'
   */
  activeBgClass?: string;
  /**
   * Optional custom text class for the active button text/icon
   * @default 'text-primary-content'
   */
  activeTextClass?: string;
}

interface SlidingTabsProps<T extends string> {
  items: readonly TabItem<T>[] | TabItem<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  /**
   * Layout size of the tabs selector
   * @default 'md'
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Optional custom layout ID for Framer Motion to prevent conflicts if multiple sliding tabs are on the same page
   * @default 'slidingTabIndicator'
   */
  layoutId?: string;
  className?: string;
  /**
   * Make the tabs expand to 100% width and stretch buttons equally
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Optional custom class for the active indicator
   */
  activeIndicatorClassName?: string;
  /**
   * Optional custom rounded class (e.g. 'rounded-xl', 'rounded-full').
   * If provided, overrides default size-based rounding. Inner buttons and indicator will be calculated automatically.
   */
  rounded?: string;
}

export function SlidingTabs<T extends string>({
  items,
  activeValue,
  onChange,
  size = "md",
  layoutId = "slidingTabIndicator",
  className = "",
  fullWidth = false,
  activeIndicatorClassName = "",
  rounded,
}: SlidingTabsProps<T>) {
  // Mặc định rounded cho từng size
  const defaultRounded = {
    xs: { container: "rounded-xl", inner: "rounded-lg" },
    sm: { container: "rounded-xl", inner: "rounded-md" },
    md: { container: "rounded-2xl", inner: "rounded-xl" },
    lg: { container: "rounded-2xl", inner: "rounded-2xl" },
  };

  // Helper tính inner rounded dựa vào container rounded
  const getInnerRoundedClass = (containerRounded: string): string => {
    if (containerRounded.includes("rounded-full")) return "rounded-full";
    if (containerRounded.includes("rounded-3xl")) return "rounded-2xl";
    if (containerRounded.includes("rounded-2xl")) return "rounded-xl";
    if (containerRounded.includes("rounded-xl")) return "rounded-lg";
    if (containerRounded.includes("rounded-lg")) return "rounded-md";
    if (containerRounded.includes("rounded-md")) return "rounded-sm";
    if (containerRounded.includes("rounded-sm")) return "rounded-xs";
    if (containerRounded.includes("rounded-none")) return "rounded-none";
    return containerRounded; // fallback
  };

  const containerRoundedClass = rounded || defaultRounded[size]?.container || "rounded-2xl";
  const innerRoundedClass = rounded ? getInnerRoundedClass(rounded) : (defaultRounded[size]?.inner || "rounded-xl");

  // Định nghĩa styles cho từng kích thước (không chứa rounded- classes)
  const sizeStyles = {
    xs: {
      container: "p-1 gap-1",
      button: "px-2 py-0.5 text-2xs font-bold gap-1",
      indicator: "shadow-xs",
      icon: 10,
    },
    sm: {
      container: "p-1 gap-1",
      button: "px-3 py-1.5 text-xs font-bold gap-2",
      indicator: "shadow-xs",
      icon: 12,
    },
    md: {
      container: "p-1 gap-2",
      button: "px-3 py-1.5 text-sm font-bold gap-2.5",
      indicator: "shadow-md",
      icon: 14,
    },
    lg: {
      container: "p-2 gap-2",
      button:
        "px-6 py-3 text-sm font-extrabold uppercase tracking-widest gap-3",
      indicator: "shadow-lg",
      icon: 16,
    },
  };

  const currentStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`flex items-center border border-base-content/5 select-none shadow-inner relative ${
        fullWidth ? "w-full" : "w-fit"
      } ${containerRoundedClass} ${currentStyle.container} ${className}`}
    >
      {items.map((item) => {
        const isActive = activeValue === item.value;
        const activeBg = item.activeBgClass || "bg-primary";
        const activeText = item.activeTextClass || "text-primary-content";

        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`relative flex items-center transition-all duration-300 cursor-pointer select-none outline-none ${
              fullWidth ? "flex-1 justify-center" : ""
            } ${innerRoundedClass} ${currentStyle.button} ${
              isActive
                ? `${activeText} scale-[1.02]`
                : "text-base-content/50 hover:text-base-content hover:bg-base-300/10"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className={`absolute inset-0 -z-10 ${innerRoundedClass} ${currentStyle.indicator} ${activeIndicatorClassName} ${activeBg}`}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {item.icon && (
              <Icon
                lucide={item.icon}
                size={currentStyle.icon}
                className="relative z-10 transition-colors duration-300"
              />
            )}
            <span className="relative z-10 transition-colors duration-300">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
