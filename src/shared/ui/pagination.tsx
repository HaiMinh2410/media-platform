"use client";

import React from "react";
import { RangeSelector } from "./range-selector";
import { cn } from "@shared/lib";

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "mục",
  className = "",
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-base-content/5 mt-6 w-full",
        className
      )}
    >
      {/* Thông tin số lượng */}
      <div className="text-xs text-base-content/50">
        Hiển thị {startItem} - {endItem} trong tổng số {totalItems} {itemLabel}
      </div>

      {/* Điều hướng phân trang */}
      <div className="flex items-center gap-3">
        <div className="join">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className="join-item btn btn-ghost rounded-full disabled:bg-transparent disabled:text-base-content/30 text-lg"
          >
            «
          </button>
          <button className="join-item btn btn-ghost pointer-events-none">
            Trang {currentPage} / {totalPages}
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className="join-item btn btn-ghost btn-circle rounded-full disabled:bg-transparent disabled:text-base-content/30 text-lg"
          >
            »
          </button>
        </div>

        {/* Bộ chọn Page Size */}
        <RangeSelector
          value={String(pageSize)}
          onChange={(val) => {
            onPageSizeChange(Number(val));
          }}
          options={pageSizeOptions.map((size) => ({
            id: String(size),
            label: String(size),
          }))}
          menuAlign="right"
          menuMinWidth="min-w-[70px] w-20"
          size="md"
          hideIcon={true}
          triggerClassName="rounded-md"
          position="top"
          dropdownClassName="rounded-lg mt-0 mb-1"
        />
      </div>
    </div>
  );
}
