import { RangeSelector } from "@shared/ui";
import { cn } from "@shared/lib";

import React from 'react';
import { Search, Check, TrendingUp, TrendingDown } from 'lucide-react';

type PanelHeaderProps = {
  conversationsCount: number;
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  filterBy: string;
  setFilterBy: (val: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (val: boolean) => void;
  usedTags: string[];
  filterRef: React.RefObject<HTMLDivElement | null>;
  sortField: 'date' | 'name';
  setSortField: (val: 'date' | 'name') => void;
  isSortOpen: boolean;
  setIsSortOpen: (val: boolean) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (val: 'asc' | 'desc') => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
};

export function PanelHeader({
  conversationsCount,
  searchInput,
  onSearchInputChange,
  filterBy,
  setFilterBy,
  isFilterOpen,
  setIsFilterOpen,
  usedTags,
  filterRef,
  sortField,
  setSortField,
  isSortOpen,
  setIsSortOpen,
  sortOrder,
  setSortOrder,
  sortRef,
}: PanelHeaderProps) {
  const filterOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'unread', label: 'Chưa đọc' },
    ...usedTags.map((tag) => ({
      id: tag,
      label: tag.split('::')[0],
    })),
  ];

  const sortOptions = [
    { id: 'date', label: 'Date' },
    { id: 'name', label: 'Name' },
  ];

  return (
    <div className="p-[16px_20px_12px]">
      <div className="relative w-full mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary pointer-events-none" size={16} />
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full p-[10px_16px_10px_38px] rounded-full border border-foreground/10 bg-background-secondary text-foreground text-base outline-none transition-all focus:border-foreground/20"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
        />
      </div>

      <div className="flex justify-between items-center pb-2 border-b border-foreground/10 text-xs text-foreground-tertiary">
        <div className="font-medium text-foreground-tertiary">
          <span>{conversationsCount} items</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div ref={filterRef} className="shrink-0">
            <RangeSelector
              value={filterBy}
              onChange={setFilterBy}
              options={filterOptions}
              isOpen={isFilterOpen}
              onOpenChange={setIsFilterOpen}
              hideIcon={true}
              size="sm"
              menuAlign="left"
            >
              <div
                className={cn(
                  'p-[8px_12px] rounded-md text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                  filterBy === 'all' && 'bg-accent-primary/10 text-accent-primary'
                )}
                onClick={() => {
                  setFilterBy('all');
                  setIsFilterOpen(false);
                }}
              >
                Tất cả
              </div>
              <div
                className={cn(
                  'p-[8px_12px] rounded-md text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                  filterBy === 'unread' && 'bg-accent-primary/10 text-accent-primary'
                )}
                onClick={() => {
                  setFilterBy('unread');
                  setIsFilterOpen(false);
                }}
              >
                Chưa đọc
              </div>

              {usedTags.length > 0 && (
                <>
                  <div className="p-[8px_12px_4px] text-3xs font-bold text-foreground-tertiary uppercase tracking-wider border-t border-foreground/10 mt-1">
                    Lọc theo nhãn
                  </div>
                  <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10">
                    {usedTags.map((tag) => {
                      const name = tag.split('::')[0];
                      const isActive = filterBy === tag;
                      return (
                        <div
                          key={tag}
                          className={cn(
                            'p-[8px_12px] rounded-md text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                            isActive && 'bg-accent-primary/10 text-accent-primary'
                          )}
                          onClick={() => {
                            setFilterBy(tag);
                            setIsFilterOpen(false);
                          }}
                        >
                          {name}
                          {isActive && <Check size={10} />}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </RangeSelector>
          </div>

          {/* Sort Dropdown */}
          <div ref={sortRef} className="flex items-center -space-x-px shrink-0">
            <RangeSelector
              value={sortField}
              onChange={(val) => setSortField(val as 'date' | 'name')}
              options={sortOptions}
              isOpen={isSortOpen}
              onOpenChange={setIsSortOpen}
              hideIcon={true}
              size="sm"
              menuAlign="left"
              triggerClassName="flex items-center justify-between gap-1 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-l-md rounded-r-none text-xs font-bold text-foreground-secondary transition-all cursor-pointer shadow-inner px-3 h-7 shrink-0"
            >
              <div
                className={cn(
                  'p-[8px_12px] rounded-md text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                  sortField === 'date' && 'bg-accent-primary/10 text-accent-primary'
                )}
                onClick={() => {
                  setSortField('date');
                  setIsSortOpen(false);
                }}
              >
                Date
              </div>
              <div
                className={cn(
                  'p-[8px_12px] rounded-md text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                  sortField === 'name' && 'bg-accent-primary/10 text-accent-primary'
                )}
                onClick={() => {
                  setSortField('name');
                  setIsSortOpen(false);
                }}
              >
                Name
              </div>
            </RangeSelector>

            {/* Sort Order Button */}
            <button
              className="flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-r-md rounded-l-none transition-all text-foreground-tertiary hover:text-foreground cursor-pointer p-1.5 h-7 w-7 shrink-0 shadow-inner"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
