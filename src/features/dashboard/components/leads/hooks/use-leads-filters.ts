import React from "react";
import { useInboxStore } from "@features/inbox/store/inbox.store";
import { Lead } from "../types";

interface UseLeadsFiltersProps {
  leads: Lead[];
  filters: {
    tag?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  workspaceId?: string;
}

export function useLeadsFilters({
  leads,
  filters,
  onFilterChange,
  workspaceId,
}: UseLeadsFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(true);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreContainerRef = React.useRef<HTMLDivElement>(null);
  const { availableTags, setAvailableTags, refreshCounter } = useInboxStore();

  React.useEffect(() => {
    if (!workspaceId) return;
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
        const json = await res.json();
        if (json.data) setAvailableTags(json.data);
      } catch (err) {
        console.error("Failed to fetch tags in useLeadsFilters:", err);
      }
    };
    fetchTags();
  }, [workspaceId, setAvailableTags, refreshCounter]);

  const parseTag = React.useCallback((tag: string) => {
    const [name, color] = tag.split('::');
    return { name, color: color || '#6366f1' };
  }, []);

  // Chỉ hiển thị nhãn được gán cho ít nhất 1 khách hàng tiềm năng
  const displayedTags = React.useMemo(() => {
    return availableTags.filter((tagStr) => {
      const { name } = parseTag(tagStr);
      return leads.some((lead) =>
        lead.tags?.some((t) => t.split("::")[0] === name)
      );
    });
  }, [availableTags, leads, parseTag]);

  const selectedTags = React.useMemo(() => {
    return filters.tag && filters.tag !== "all"
      ? filters.tag.split(",")
      : [];
  }, [filters.tag]);

  const handleTagClick = React.useCallback((name: string) => {
    if (!filters.tag || filters.tag === "all") {
      onFilterChange("tag", name);
    } else {
      const tagsArr = filters.tag.split(",");
      if (tagsArr.includes(name)) {
        const nextTags = tagsArr.filter((t) => t !== name);
        onFilterChange("tag", nextTags.length > 0 ? nextTags.join(",") : "all");
      } else {
        onFilterChange("tag", [...tagsArr, name].join(","));
      }
    }
  }, [filters.tag, onFilterChange]);

  const tagButtonText = React.useMemo(() => {
    return selectedTags.length === 0
      ? "Nhãn"
      : selectedTags.length === 1
      ? `Nhãn: ${selectedTags[0]}`
      : `Đã chọn ${selectedTags.length} lựa chọn`;
  }, [selectedTags]);

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        moreContainerRef.current &&
        !moreContainerRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMoreOpen]);

  return {
    showFilters,
    setShowFilters,
    isMoreOpen,
    setIsMoreOpen,
    moreContainerRef,
    parseTag,
    displayedTags,
    selectedTags,
    handleTagClick,
    tagButtonText,
  };
}
