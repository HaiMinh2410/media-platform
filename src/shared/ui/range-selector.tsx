"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@shared/lib/utils";

export interface RangeOption {
  id: string;
  label: string;
  icon?: React.ReactNode | ((className?: string) => React.ReactNode);
  dropdownLabel?: React.ReactNode;
  iconColorClass?: string;
  /** Hiển thị line ngăn cách phía trên option này */
  dividerBefore?: boolean;
  className?: string;
}

interface RangeSelectorProps {
  value?: string;
  onChange?: (value: any) => void;
  options?: RangeOption[];
  className?: string;

  // Controlled state from parent
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Customization
  defaultIcon?: React.ReactNode;
  hideIcon?: boolean;
  menuMinWidth?: string;
  menuAlign?: "left" | "right";

  // Custom styles & content
  triggerClassName?: string;
  dropdownClassName?: string;
  menuItemClassName?: string;
  children?: React.ReactNode;

  // Layout size of the selector
  size?: "xs" | "sm" | "md" | "lg";

  // Position direction of the dropdown menu
  position?: "bottom" | "top";

  // Custom trigger element to override default button
  customTrigger?: React.ReactNode;
}

export const RangeSelector = React.forwardRef<HTMLDivElement, RangeSelectorProps>(
  (
    {
      value,
      onChange,
      options,
      className = "",
      isOpen: controlledIsOpen,
      onOpenChange,
      defaultIcon,
      hideIcon = false,
      menuMinWidth = "min-w-[155px]",
      menuAlign = "left",
      triggerClassName = "",
      dropdownClassName = "",
      menuItemClassName = "",
      children,
      size = "md",
      position = "bottom",
      customTrigger,
    },
    ref
  ) => {
    const [localIsOpen, setLocalIsOpen] = useState(false);

    // Styles based on size
    const sizeStyles = {
      xs: {
        trigger: "px-2 h-6 text-2xs font-bold gap-1.5 rounded-lg",
        iconClass: "w-3 h-3",
        chevronClass: "w-3 h-3",
        menuItem: "px-2 py-1 rounded-lg text-2xs font-bold gap-1.5",
        dropdown: "p-1 rounded-lg gap-0.5",
      },
      sm: {
        trigger: "px-3 h-7 text-xs font-bold gap-2 rounded-md",
        iconClass: "w-3.5 h-3.5",
        chevronClass: "w-3.5 h-3.5",
        menuItem: "px-2.5 py-1.5 rounded-md text-xs font-bold gap-2",
        dropdown: "p-1.5 rounded-md gap-0.5",
      },
      md: {
        trigger: "px-4.5 h-8 text-xs font-bold gap-2 rounded-full",
        iconClass: "w-3.5 h-3.5",
        chevronClass: "w-3.5 h-3.5",
        menuItem: "px-3.5 py-2 rounded-xl text-xs font-semibold gap-2.5",
        dropdown: "p-1.5 rounded-xl gap-0.5",
      },
      lg: {
        trigger: "px-6 h-10 text-sm font-extrabold gap-3 rounded-2xl",
        iconClass: "w-4 h-4",
        chevronClass: "w-4 h-4",
        menuItem: "px-5 py-3 rounded-2xl text-sm font-extrabold gap-3",
        dropdown: "p-2 rounded-2xl gap-1",
      },
    };

    const currentStyle = sizeStyles[size] || sizeStyles.md;
    const localRef = useRef<HTMLDivElement>(null);
    const dropdownRef = (ref || localRef) as React.RefObject<HTMLDivElement>;

    const isControlled = controlledIsOpen !== undefined;
    const open = isControlled ? controlledIsOpen : localIsOpen;
    const setOpen = (val: boolean) => {
      if (isControlled) {
        onOpenChange?.(val);
      } else {
        setLocalIsOpen(val);
      }
    };

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          open &&
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, isControlled, onOpenChange]);

    const selectedOption = options?.find((o) => o.id === value);
    const getSelectedLabel = () => {
      return selectedOption ? selectedOption.label : "Chọn tùy chọn";
    };

    // Helper to render icon
    const renderIcon = (
      iconElement:
        | React.ReactNode
        | ((className?: string) => React.ReactNode)
        | undefined,
      fallbackIcon: React.ReactNode,
      iconClassName: string,
    ) => {
      if (hideIcon) return null;
      if (!iconElement) return fallbackIcon;

      if (typeof iconElement === "function") {
        return iconElement(iconClassName);
      }
      return iconElement;
    };

    const activeIcon = selectedOption?.icon || defaultIcon;
    const activeIconFallback = (
      <Calendar className={`${currentStyle.iconClass} text-base-content/60`} />
    );
    const triggerIconColor =
      selectedOption?.iconColorClass || "text-base-content/60";

    const renderTrigger = () => {
      if (customTrigger) {
        if (React.isValidElement(customTrigger)) {
          return React.cloneElement(customTrigger as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
              if ((customTrigger.props as any).onClick) {
                (customTrigger.props as any).onClick(e);
              }
              setOpen(!open);
            },
          });
        }
        return <div onClick={() => setOpen(!open)}>{customTrigger}</div>;
      }

      return (
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            `btn btn-soft btn-sm rounded-full hover:bg-soft/60 ${currentStyle.trigger}`,
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2.5 flex-1 text-left overflow-hidden">
            {renderIcon(
              activeIcon,
              activeIconFallback,
              `${currentStyle.iconClass} ${triggerIconColor}`,
            )}
            <span className="truncate">{getSelectedLabel()}</span>
          </div>
          <ChevronDown
            className={`${currentStyle.chevronClass} text-base-content/40 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>
      );
    };

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        {renderTrigger()}

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: position === "top" ? -5 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: position === "top" ? -5 : 5 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-50 flex flex-col",
                position === "top" ? "bottom-[120%]" : "top-[120%]",
                menuAlign === "left" ? "left-0" : "right-0",
                menuMinWidth,
                `bg-foreground/5 border border-foreground/10 backdrop-blur-xl ${currentStyle.dropdown}`,
                dropdownClassName
              )}
            >
              {children
                ? children
                : options?.map((r) => (
                    <React.Fragment key={r.id}>
                      {r.dividerBefore && (
                        <div className="h-px bg-foreground/10 my-1 -mx-1" />
                      )}
                      <button
                        onClick={() => {
                          onChange?.(r.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center transition-all cursor-pointer",
                          currentStyle.menuItem,
                          value === r.id
                            ? "text-foreground bg-foreground/10"
                            : "text-foreground/60 hover:text-foreground hover:bg-foreground/5",
                          menuItemClassName,
                          r.className
                        )}
                      >
                        {renderIcon(
                          r.icon,
                          null,
                          `${currentStyle.iconClass} ${r.iconColorClass || ""}`,
                        )}
                        <span className="flex-1 text-left">
                          {r.dropdownLabel || r.label}
                        </span>
                        {value === r.id && !r.icon && (
                          <svg
                            className={`${currentStyle.iconClass} text-foreground`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    </React.Fragment>
                  ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

RangeSelector.displayName = "RangeSelector";

