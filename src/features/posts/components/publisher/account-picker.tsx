'use client';

import { Icon } from "@shared/ui";
import { cn } from "@shared/lib";

import React, { useState, useRef, useEffect } from "react";
import { PlatformAccount } from "@features/settings";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X, Check, PlusCircle } from "lucide-react";

type AccountPickerProps = {
  accounts: PlatformAccount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function AccountPicker({
  accounts,
  selectedIds,
  onChange,
}: AccountPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAccount = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Prevent selection of legacy accounts
    const account = accounts.find((a) => a.id === id);
    if ((account as any)?.is_legacy) {
      return;
    }

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectGroup = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only select non-legacy accounts
    const groupIds = accounts
      .filter(
        (a) =>
          a.platform.toLowerCase() === platform.toLowerCase() &&
          !(a as any).is_legacy,
      )
      .map((a) => a.id);
    const newSelected = new Set(selectedIds);
    groupIds.forEach((id) => newSelected.add(id));
    onChange(Array.from(newSelected));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
  const visibleChips = selectedAccounts.slice(0, 3);
  const overflowCount = selectedAccounts.length - 3;

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.username && a.username.toLowerCase().includes(search.toLowerCase())),
  );

  const fbAccounts = filteredAccounts.filter(
    (a) => a.platform.toLowerCase() === "facebook",
  );
  const igAccounts = filteredAccounts.filter(
    (a) => a.platform.toLowerCase() === "instagram",
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* TRIGGER BAR */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center min-h-[52px] bg-base-200 border border-base-content/10 shadow-inner rounded-xl px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors"
      >
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {selectedAccounts.length === 0 ? (
            <span className="text-base-content/50 text-[13px] ml-1">
              Chọn tài khoản đăng bài...
            </span>
          ) : (
            <>
              {visibleChips.map((acc) => {
                const isFb = acc.platform.toLowerCase() === "facebook";
                return (
                  <div
                    key={acc.id}
                    className="flex items-center bg-base-300 rounded-full pl-1 pr-2 py-1 border border-base-content/5 gap-2"
                  >
                    <div
                      className="relative w-6 h-6 rounded-full flex items-center justify-center text-white text-2xs font-bold"
                      style={{ backgroundColor: isFb ? "#1877F2" : "#E1306C" }}
                    >
                      {acc.avatar_url ? (
                        <img
                          src={acc.avatar_url}
                          alt=""
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        acc.name.charAt(0).toUpperCase()
                      )}
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center border border-base-200"
                        style={{
                          background: isFb
                            ? "#1877F2"
                            : "linear-gradient(45deg, #405DE6 0%, #E1306C 100%)",
                        }}
                      >
                        {isFb ? (
                          <Icon
                            name="facebook"
                            size={6}
                            className="text-white"
                          />
                        ) : (
                          <Icon
                            name="instagram"
                            size={6}
                            className="text-white"
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-[12px] text-base-content font-medium whitespace-nowrap">
                      {acc.name}
                    </span>
                    <button
                      onClick={(e) => toggleAccount(acc.id, e)}
                      className="text-base-content/40 hover:text-error transition-colors p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {overflowCount > 0 && (
                <div className="bg-primary/20 text-primary text-[12px] font-semibold px-3 py-1 rounded-full border border-primary/30">
                  +{overflowCount} khác
                </div>
              )}
            </>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-base-content/50 transition-transform duration-200 ml-2",
            isOpen && "rotate-180",
          )}
        />
      </div>

      {/* DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-[calc(100%+8px)] left-0 w-full bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]"
          >
            {/* Search input */}
            <div className="p-3 border-b border-base-content/5">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tài khoản..."
                  className="w-full bg-base-200 border border-base-content/10 rounded-lg pl-9 pr-3 py-2 text-[13px] text-base-content placeholder:text-base-content/40 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2 p-3 pb-2">
              <button
                onClick={(e) => selectGroup("facebook", e)}
                className="btn btn-xs btn-soft border-none hover:bg-base-300 text-base-content/70 cursor-pointer"
              >
                ✓ Tất cả Facebook
              </button>
              <button
                onClick={(e) => selectGroup("instagram", e)}
                className="btn btn-xs btn-soft border-none hover:bg-base-300 text-base-content/70 cursor-pointer"
              >
                ✓ Tất cả Instagram
              </button>
              <button className="btn btn-xs btn-soft border-none hover:bg-base-300 text-base-content/70 cursor-pointer">
                📦 Preset Marketing
              </button>
              <button
                onClick={clearAll}
                className="btn btn-xs btn-link text-error hover:no-underline ml-auto cursor-pointer"
              >
                ✕ Bỏ hết
              </button>
            </div>

            {/* Account List */}
            <div className="overflow-y-auto max-h-[280px] pb-2">
              {fbAccounts.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-[11px] font-bold text-base-content/40 tracking-[1px] font-mono">
                    FACEBOOK
                  </div>
                  {fbAccounts.map((acc) => (
                    <AccountRow
                      key={acc.id}
                      account={acc}
                      isSelected={selectedIds.includes(acc.id)}
                      onToggle={() => toggleAccount(acc.id)}
                    />
                  ))}
                </div>
              )}
              {igAccounts.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[11px] font-bold text-base-content/40 tracking-[1px] font-mono">
                    INSTAGRAM
                  </div>
                  {igAccounts.map((acc) => (
                    <AccountRow
                      key={acc.id}
                      account={acc}
                      isSelected={selectedIds.includes(acc.id)}
                      onToggle={() => toggleAccount(acc.id)}
                    />
                  ))}
                </div>
              )}
              {fbAccounts.length === 0 && igAccounts.length === 0 && (
                <div className="p-8 text-center text-base-content/50 text-[13px]">
                  Không tìm thấy tài khoản nào
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountRow({
  account,
  isSelected,
  onToggle,
}: {
  account: any;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const isFb = account.platform.toLowerCase() === "facebook";
  const isLegacy = account.is_legacy;

  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors border-b border-base-content/5 last:border-0",
        isSelected
          ? "bg-primary/10 hover:bg-primary/20"
          : "hover:bg-base-300/60",
        isLegacy && "opacity-70",
      )}
    >
      <div
        className="relative w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold shrink-0"
        style={{ backgroundColor: isFb ? "#1877F2" : "#E1306C" }}
      >
        {account.avatar_url ? (
          <img
            src={account.avatar_url}
            alt=""
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          account.name.charAt(0).toUpperCase()
        )}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-[14px] h-[14px] rounded-full flex items-center justify-center border-2",
            isSelected ? "border-primary/20" : "border-base-200",
          )}
          style={{
            background: isFb
              ? "#1877F2"
              : "linear-gradient(45deg, #405DE6 0%, #E1306C 100%)",
          }}
        >
          {isFb ? (
            <Icon name="facebook" size={7} className="text-white" />
          ) : (
            <Icon name="instagram" size={7} className="text-white" />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[13px] font-bold truncate",
              isSelected ? "text-primary" : "text-base-content",
            )}
          >
            {account.name}
          </span>
          {isLegacy && (
            <span className="badge badge-xs badge-soft badge-warning font-bold uppercase tracking-tighter shrink-0">
              Cần kết nối lại
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-[11px] truncate",
            isSelected ? "text-primary" : "text-base-content/50",
          )}
        >
          {account.username
            ? `@${account.username}`
            : isLegacy
              ? "Tài khoản cũ"
              : ""}
        </span>
      </div>

      {isSelected && (
        <div className="shrink-0 text-primary">
          <Check size={16} strokeWidth={3} />
        </div>
      )}
    </div>
  );
}
