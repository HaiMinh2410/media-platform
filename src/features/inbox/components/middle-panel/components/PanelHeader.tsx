import React from 'react';
import { Search, ChevronDown, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@shared/lib/utils';

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
  return (
    <div className="p-[16px_20px_12px]">
      <div className="relative w-full mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary pointer-events-none" size={16} />
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full p-[10px_16px_10px_38px] rounded-md border border-foreground/10 bg-background-secondary text-foreground text-base outline-none transition-all focus:border-accent-primary focus:bg-background-tertiary focus:ring-3 focus:ring-accent-primary/20"
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
          <div className="flex items-center gap-1 bg-background-secondary p-[2px_6px] rounded-md border border-foreground/10 shrink-0 relative" ref={filterRef}>
            <div
              className="flex items-center justify-between gap-1 cursor-pointer text-xs font-medium text-foreground-secondary w-[90px] min-w-0"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span className="truncate">
                {filterBy === 'all'
                  ? 'Tất cả'
                  : filterBy === 'unread'
                  ? 'Chưa đọc'
                  : filterBy.split('::')[0]}
              </span>
              <ChevronDown size={12} className={cn('transition-transform duration-200 text-foreground-tertiary', isFilterOpen && 'rotate-180')} />
            </div>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-1 bg-base-200 border border-foreground/10 rounded-lg shadow-2xl z-[100] w-[180px] overflow-hidden flex flex-col">
                <div
                  className={cn(
                    'p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
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
                    'p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                    filterBy === 'unread' && 'bg-accent-primary/10 text-accent-primary'
                  )}
                  onClick={() => {
                    setFilterBy('unread');
                    setIsFilterOpen(false);
                  }}
                >
                  Chưa đọc
                </div>

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
                          'p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
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
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-foreground/5 p-[2px_6px] rounded-md border border-foreground/10 shrink-0 relative" ref={sortRef}>
            <div
              className="flex items-center justify-between gap-1 cursor-pointer text-xs font-medium text-foreground-secondary w-[50px] min-w-0"
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <span className="truncate">{sortField === 'date' ? 'Date' : 'Name'}</span>
              <ChevronDown size={12} className={cn('transition-transform duration-200 text-foreground-tertiary', isSortOpen && 'rotate-180')} />
            </div>

            {isSortOpen && (
              <div className="absolute top-full left-0 mt-1 bg-base-200 border border-foreground/10 rounded-lg shadow-2xl z-[100] w-[100px] overflow-hidden flex flex-col">
                <div
                  className={cn(
                    'p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
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
                    'p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground',
                    sortField === 'name' && 'bg-accent-primary/10 text-accent-primary'
                  )}
                  onClick={() => {
                    setSortField('name');
                    setIsSortOpen(false);
                  }}
                >
                  Name
                </div>
              </div>
            )}

            <button
              className="flex items-center justify-center bg-transparent border-none text-foreground-tertiary cursor-pointer p-0.5 rounded transition-all hover:text-foreground hover:bg-foreground/5"
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
