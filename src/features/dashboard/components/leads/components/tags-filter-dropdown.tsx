import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@shared/lib/utils";

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
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className={triggerClassName || "btn btn-soft btn-sm hover:bg-base-100"}
      >
        <span className="truncate mr-1 text-left">
          {tagButtonText}
        </span>
        <ChevronDown size={12} className="opacity-60 shrink-0" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-1.5 shadow-xl bg-base-100 rounded-xl w-52 z-100 border border-base-content/5 mt-1 animate-fade-in max-h-60 overflow-y-auto"
      >
        <li>
          <button
            onClick={() => onFilterChange("tag", "all")}
            className={cn(
              "text-xs py-1.5 font-bold cursor-pointer transition-colors duration-150 flex items-center gap-2",
              selectedTags.length === 0 ? "text-primary bg-primary/5" : "text-base-content/70 hover:bg-base-200"
            )}
          >
            <div className="w-2.5 h-2.5 rounded-full border border-base-content/30" />
            Tất cả nhãn
          </button>
        </li>
        {displayedTags.map((tagStr) => {
          const { name, color } = parseTag(tagStr);
          const isSelected = selectedTags.includes(name);
          return (
            <li key={name}>
              <button
                onClick={() => handleTagClick(name)}
                className={cn(
                  "text-xs py-1.5 cursor-pointer transition-colors duration-150 flex items-center gap-2",
                  isSelected ? "text-primary bg-primary/5 font-bold" : "text-base-content/70 hover:bg-base-200"
                )}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-base-content/5" 
                  style={{ backgroundColor: color }} 
                />
                <span className="truncate">{name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
