import React from "react";
import { Lead, LeadStage } from "../types";
import { SubTabConfig } from "../components/sub-tab";
import { useInboxStore } from "@features/inbox/store/inbox.store";

export type SortField = "date" | "name" | "stage" | "source" | "tags";
export type SortOrder = "none" | "asc" | "desc";

interface UseLeadsTableParams {
  leads: Lead[];
  allLeads: Lead[];
  stages: LeadStage[];
  currentSubTab: string;
  onSubTabChange: (tabId: string) => void;
}

export function useLeadsTable({
  leads,
  allLeads,
  stages,
  currentSubTab,
  onSubTabChange,
}: UseLeadsTableParams) {
  const { accountGroups } = useInboxStore();

  const [sortField, setSortField] = React.useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("none");

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
    } else {
      if (sortOrder === "none") {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortOrder("none");
        setSortField(null);
      }
    }
  };

  const sortedLeads = React.useMemo(() => {
    if (!sortField || sortOrder === "none") return leads;

    const sorted = [...leads];
    
    sorted.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "date") {
        const parseDateTime = (lead: Lead) => {
          if (!lead.fullDate) return 0;
          const [day, month, year] = lead.fullDate.split("/").map(Number);
          const [hour, minute] = lead.date.split(":").map(Number);
          return new Date(year, month - 1, day, hour, minute).getTime();
        };
        valA = parseDateTime(a);
        valB = parseDateTime(b);
      } else if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === "stage") {
        valA = stages.findIndex((s) => s.id === a.stage);
        valB = stages.findIndex((s) => s.id === b.stage);
      } else if (sortField === "source") {
        const getAccountName = (lead: Lead) => {
          if (!lead.accountId) return lead.source || "";
          for (const group of accountGroups) {
            const found = group.members.find((m) => m.id === lead.accountId);
            if (found) return found.name;
          }
          return lead.source || "";
        };
        valA = getAccountName(a).toLowerCase();
        valB = getAccountName(b).toLowerCase();
      } else if (sortField === "tags") {
        valA = a.tags ? a.tags.length : 0;
        valB = b.tags ? b.tags.length : 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [leads, sortField, sortOrder, stages, accountGroups]);

  // State hiển thị 2 sub-tabs đặc biệt
  const [showLostSubTab, setShowLostSubTab] = React.useState(false);
  const [showUnqualifiedSubTab, setShowUnqualifiedSubTab] = React.useState(false);

  // Đọc cấu hình hiển thị từ localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setShowLostSubTab(localStorage.getItem("leads_table_show_lost") === "true");
      setShowUnqualifiedSubTab(localStorage.getItem("leads_table_show_unqualified") === "true");
    }
  }, []);

  const handleToggleLost = (val: boolean) => {
    setShowLostSubTab(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("leads_table_show_lost", String(val));
    }
  };

  const handleToggleUnqualified = (val: boolean) => {
    setShowUnqualifiedSubTab(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("leads_table_show_unqualified", String(val));
    }
  };

  // Tự động chuyển sub-tab về "Tất cả" nếu sub-tab đang chọn bị ẩn đi
  React.useEffect(() => {
    if (currentSubTab === "lost" && !showLostSubTab) {
      onSubTabChange("all");
    }
    if (currentSubTab === "unqualified" && !showUnqualifiedSubTab) {
      onSubTabChange("all");
    }
  }, [currentSubTab, showLostSubTab, showUnqualifiedSubTab, onSubTabChange]);

  // Tạo danh sách sub-tabs động dựa trên stages thực tế truyền vào (lọc theo toggle)
  const subTabs = React.useMemo<SubTabConfig[]>(() => {
    const list: SubTabConfig[] = [
      { id: "all", label: "Tất cả", showCount: false, showChevron: false }
    ];
    
    const filteredStages = stages.filter((stage) => {
      if (stage.id === "lost") return showLostSubTab;
      if (stage.id === "unqualified") return showUnqualifiedSubTab;
      return true;
    });

    filteredStages.forEach((stage, idx) => {
      list.push({
        id: stage.id,
        label: stage.label,
        showCount: true,
        showChevron: idx < filteredStages.length - 1
      });
    });
    
    return list;
  }, [stages, showLostSubTab, showUnqualifiedSubTab]);

  return {
    sortedLeads,
    sortField,
    sortOrder,
    handleSort,
    showLostSubTab,
    showUnqualifiedSubTab,
    handleToggleLost,
    handleToggleUnqualified,
    subTabs,
  };
}
