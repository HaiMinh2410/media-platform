import { RangeSelector } from "@shared/ui";
import { cn } from "@shared/lib";

import React from "react";
import { ChevronDown } from "lucide-react";

interface TagsFilterDropdownProps {
  displayedTags: string[];
  selectedTags: string[];
  tagButtonText: string;
  onFilterChange: (key: string, value: string) => void;
  handleTagClick: (name: string) => void;
  parseTag: (tag: string) => { name: string; color: string };
  triggerClassName?: string;
}

export function TagsFilterDropdown({
  displayedTags,
  selectedTags,
  tagButtonText,
  onFilterChange,
  handleTagClick,
  parseTag,
  triggerClassName,
}: TagsFilterDropdownProps) {
  return (
    <RangeSelector
      menuAlign="right"
      menuMinWidth="w-52"
      dropdownClassName="bg-soft rounded-lg"
      customTrigger={
        <button
          type="button"
          className={cn(
            triggerClassName || "btn btn-soft btn-sm hover:bg-base-100",
            "flex items-center gap-1.5 cursor-pointer"
          )}
        >
          <span className="truncate text-left">
            {tagButtonText}
          </span>
          <ChevronDown size={12} className="opacity-60 shrink-0" />
        </button>
      }
    >
      <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onFilterChange("tag", "all")}
          className={cn(
            "text-sm px-2.5 py-1.5 rounded-md cursor-pointer flex items-center gap-2.5 w-full text-left transition-colors duration-150",
            selectedTags.length === 0 
              ? "text-primary bg-primary/5 dark:bg-primary/10 font-bold" 
              : "text-base-content/70 hover:bg-base-200/50 dark:hover:bg-base-800/40"
          )}
        >
          <input
            type="checkbox"
            checked={selectedTags.length === 0}
            readOnly
            className="checkbox checkbox-primary checkbox-sm pointer-events-none shrink-0"
          />
          Tất cả nhãn
        </button>
        {displayedTags.map((tagStr) => {
          const { name, color } = parseTag(tagStr);
          const isSelected = selectedTags.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => handleTagClick(name)}
              className={cn(
                "text-sm px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-2.5 w-full text-left",
                isSelected 
                  ? "text-primary bg-primary/5 dark:bg-primary/10 font-bold" 
                  : "text-base-content/70 hover:bg-base-200/50 dark:hover:bg-base-800/40"
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="checkbox checkbox-primary checkbox-sm pointer-events-none shrink-0"
              />
              <span className="truncate">{name}</span>
            </button>
          );
        })}
      </div>
    </RangeSelector>
  );
}
