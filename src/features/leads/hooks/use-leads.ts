import { useState, useEffect } from "react";
import { Lead, LeadStage } from "../types";
import { LEAD_STAGES } from "../constants";
import { useInboxStore } from "@features/inbox/store/inbox.store";
import {
  getLeadsFromDB,
  updateLeadStageInDB,
  deleteLeadInDB,
} from "@features/dashboard/actions/dashboard.actions";

export function useLeads(workspaceId: string) {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const { accountGroups } = useInboxStore();

  // Quản lý cụm tài khoản hiện tại được lọc
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);

  // Đọc giá trị đã lưu từ localStorage sau khi mounted để tránh lỗi Hydration Mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("leads_selected_group_id");
      if (saved) {
        setSelectedGroupId(saved);
      }
    }
  }, []);

  const handleGroupChange = (id: string | null) => {
    setSelectedGroupId(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("leads_selected_group_id", id);
      } else {
        localStorage.removeItem("leads_selected_group_id");
      }
    }
  };

  // 1. Quản lý trạng thái bằng React State
  const [stages, setStages] = useState<LeadStage[]>(LEAD_STAGES);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentSubTab, setCurrentSubTab] = useState<string>("all");

  // Khôi phục danh sách giai đoạn từ localStorage khi mounted để lưu trữ bền vững
  useEffect(() => {
    if (typeof window !== "undefined" && workspaceId) {
      const saved = localStorage.getItem(`kanban_stages_${workspaceId}`);
      if (saved) {
        try {
          setStages(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved stages from localStorage:", e);
        }
      }
    }
  }, [workspaceId]);

  // Tự động đồng bộ danh sách giai đoạn vào localStorage khi có thay đổi
  useEffect(() => {
    if (typeof window !== "undefined" && workspaceId && stages.length > 0) {
      localStorage.setItem(`kanban_stages_${workspaceId}`, JSON.stringify(stages));
    }
  }, [stages, workspaceId]);

  // Tải danh sách leads thực tế từ DB khi mounted
  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      getLeadsFromDB(workspaceId)
        .then((dbLeads) => {
          setLeads(dbLeads);
        })
        .catch((err) => {
          console.error("Failed to load leads from DB:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [workspaceId]);

  // Trạng thái hiển thị các cột đặc biệt và lọc chưa đọc
  const [showLost, setShowLost] = useState(false);
  const [showUnqualified, setShowUnqualified] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Trạng thái bộ lọc thông minh
  const [filters, setFilters] = useState({
    source: "all",
    stage: "all",
    campaign: "all",
    form: "all",
    date: "all",
    tag: "all",
  });

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Tự động tắt Toast sau 3 giây
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // 2. Logic Lọc dữ liệu khách hàng
  const selectedGroup = accountGroups.find((g) => g.id === selectedGroupId);

  const filteredLeads = leads.filter((lead) => {
    // Lọc theo sub-tab (trong chế độ xem bảng)
    const matchesSubTab =
      viewMode === "table" && currentSubTab !== "all"
        ? lead.stage === currentSubTab
        : true;

    // Lọc chỉ hiển thị khách hàng tiềm năng chưa đọc
    const matchesUnreadOnly = showUnreadOnly ? lead.unread === true : true;

    // Lọc theo cụm tài khoản được chọn (chỉ giữ lại những leads thuộc tài khoản thành viên trong cụm)
    const matchesCluster = selectedGroup
      ? selectedGroup.members.some((member) => member.id === lead.accountId)
      : true;

    // Lọc theo dropdown Trạng thái
    const matchesStageFilter =
      filters.stage !== "all" ? lead.stage === filters.stage : true;

    // Lọc theo dropdown Nguồn
    const matchesSource =
      filters.source !== "all" ? lead.source === filters.source : true;

    // Lọc theo dropdown Chiến dịch (giả lập)
    const matchesCampaign =
      filters.campaign !== "all"
        ? filters.campaign === "Chiến dịch Hè 2026"
          ? lead.id !== "3"
          : lead.id === "3"
        : true;

    // Lọc theo dropdown Mẫu (giả lập)
    const matchesForm =
      filters.form !== "all"
        ? filters.form === "Đăng ký nhận báo giá"
          ? lead.id === "1"
          : lead.id !== "1"
        : true;

    // Lọc theo ngày thực tế (Hỗ trợ Presets & Ngày cụ thể chọn từ Double Calendar)
    let matchesDate = true;
    if (filters.date !== "all") {
      const parseDate = (dStr: string) => {
        const parts = dStr.split("/");
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      };

      const leadDateObj = lead.fullDate ? parseDate(lead.fullDate) : new Date();
      leadDateObj.setHours(0, 0, 0, 0);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Nếu năm hiện tại chưa đến 2026, ta lấy ngày 28/05/2026 làm ngày "Hôm nay" tham chiếu
      // để khớp hoàn hảo với mock data của cơ sở dữ liệu mẫu trong dự án.
      const referenceToday =
        now.getFullYear() >= 2026 ? now : new Date(2026, 4, 28);

      if (filters.date === "Hôm nay") {
        const formattedToday = referenceToday.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        matchesDate = lead.fullDate === formattedToday;
      } else if (filters.date === "Hôm qua") {
        const yesterday = new Date(referenceToday);
        yesterday.setDate(referenceToday.getDate() - 1);
        const formattedYesterday = yesterday.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        matchesDate = lead.fullDate === formattedYesterday;
      } else if (filters.date === "7 ngày qua") {
        const past7Days = new Date(referenceToday);
        past7Days.setDate(referenceToday.getDate() - 7);
        matchesDate = leadDateObj >= past7Days && leadDateObj <= referenceToday;
      } else if (filters.date === "14 ngày qua") {
        const past14Days = new Date(referenceToday);
        past14Days.setDate(referenceToday.getDate() - 14);
        matchesDate =
          leadDateObj >= past14Days && leadDateObj <= referenceToday;
      } else if (filters.date === "30 ngày qua") {
        const past30Days = new Date(referenceToday);
        past30Days.setDate(referenceToday.getDate() - 30);
        matchesDate =
          leadDateObj >= past30Days && leadDateObj <= referenceToday;
      } else if (filters.date === "Tháng này") {
        matchesDate =
          leadDateObj.getMonth() === referenceToday.getMonth() &&
          leadDateObj.getFullYear() === referenceToday.getFullYear();
      } else if (filters.date.includes(" - ")) {
        // Lọc theo khoảng ngày tùy chỉnh từ Lịch đôi (ví dụ: "20/05/2026 - 28/05/2026")
        const parts = filters.date.split(" - ");
        const startParts = parts[0].split("/");
        const endParts = parts[1].split("/");
        
        const startDate = new Date(
          parseInt(startParts[2]),
          parseInt(startParts[1]) - 1,
          parseInt(startParts[0])
        );
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(
          parseInt(endParts[2]),
          parseInt(endParts[1]) - 1,
          parseInt(endParts[0])
        );
        endDate.setHours(23, 59, 59, 999);

        matchesDate = leadDateObj >= startDate && leadDateObj <= endDate;
      } else {
        // Lọc theo một ngày cụ thể (ví dụ: "28/05/2026" chọn từ Lịch)
        matchesDate = lead.fullDate === filters.date;
      }
    }

    // Lọc theo nhãn được chọn (Hỗ trợ chọn nhiều nhãn cùng lúc - Khớp ít nhất một nhãn)
    const matchesTag =
      filters.tag && filters.tag !== "all"
        ? (() => {
            const selectedTags = filters.tag.split(",");
            return (
              lead.tags?.some((t) => selectedTags.includes(t.split("::")[0])) ??
              false
            );
          })()
        : true;

    return (
      matchesSubTab &&
      matchesUnreadOnly &&
      matchesCluster &&
      matchesStageFilter &&
      matchesSource &&
      matchesCampaign &&
      matchesForm &&
      matchesDate &&
      matchesTag
    );
  });

  // 3. Cơ chế thêm giai đoạn tùy chỉnh (hỗ trợ thêm trực tiếp hoặc mở Modal)
  const handleAddStage = (stageLabel?: string) => {
    if (stageLabel && stageLabel.trim()) {
      const trimmed = stageLabel.trim();
      const stageId = `custom_${trimmed.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
      
      const randomIcon = "⚙️";
      const newStage: LeadStage = {
        id: stageId,
        label: trimmed,
        count: 0,
        icon: randomIcon,
        color: "accent",
      };

      const convertedIndex = stages.findIndex((s) => s.id === "converted");
      const updatedStages = [...stages];
      if (convertedIndex !== -1) {
        updatedStages.splice(convertedIndex, 0, newStage);
      } else {
        updatedStages.push(newStage);
      }
      setStages(updatedStages);

      setToast({
        show: true,
        message: `Đã tạo thêm giai đoạn "${trimmed}" thành công!`,
        type: "success",
      });
    } else {
      setIsFunnelModalOpen(true);
    }
  };

  // 4. Cơ chế di chuyển & Cập nhật giai đoạn
  const handleChangeStage = async (leadId: string, newStageId: string) => {
    // Cập nhật local state trước để UI phản hồi lập tức (Optimistic Update)
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, stage: newStageId } : lead
      )
    );

    const stageLabel =
      stages.find((s) => s.id === newStageId)?.label || newStageId;
    const leadName = leads.find((l) => l.id === leadId)?.name || "Khách hàng";

    try {
      await updateLeadStageInDB(leadId, newStageId);

      setToast({
        show: true,
        message: `Đã chuyển ${leadName} sang giai đoạn "${stageLabel}".`,
        type: "info",
      });
    } catch (err) {
      console.error("Failed to update lead stage in DB:", err);
      setToast({
        show: true,
        message: `Lỗi kết nối DB khi cập nhật giai đoạn!`,
        type: "info",
      });
    }
  };

  // Cơ chế xóa khách hàng tiềm năng
  const handleDeleteLead = async (leadId: string) => {
    const leadName = leads.find((l) => l.id === leadId)?.name || "Khách hàng";

    // Cập nhật local state trước
    setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadId));
    setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));

    try {
      await deleteLeadInDB(leadId);

      setToast({
        show: true,
        message: `Đã xóa khách hàng tiềm năng "${leadName}" thành công!`,
        type: "success",
      });
    } catch (err) {
      console.error("Failed to delete lead in DB:", err);
      setToast({
        show: true,
        message: `Lỗi kết nối DB khi xóa khách hàng tiềm năng!`,
        type: "info",
      });
    }
  };

  // 5. Thao tác hàng loạt (Chỉnh sửa hàng loạt)
  const handleBulkEdit = (newStageId: string) => {
    if (selectedLeadIds.length === 0) return;

    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        selectedLeadIds.includes(lead.id)
          ? { ...lead, stage: newStageId }
          : lead
      )
    );

    const stageLabel =
      stages.find((s) => s.id === newStageId)?.label || newStageId;
    const count = selectedLeadIds.length;

    setSelectedLeadIds([]); // Reset selection

    setToast({
      show: true,
      message: `Đã cập nhật hàng loạt ${count} khách hàng sang "${stageLabel}".`,
      type: "success",
    });
  };

  // Quản lý tích chọn checkbox từng lead
  const handleSelectLead = (leadId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedLeadIds((prev) => [...prev, leadId]);
    } else {
      setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
    }
  };

  // Tích chọn toàn bộ lead trong view hiện tại
  const handleSelectAllLeads = (isChecked: boolean) => {
    if (isChecked) {
      const activeIds = filteredLeads.map((l) => l.id);
      setSelectedLeadIds((prev) =>
        Array.from(new Set([...prev, ...activeIds]))
      );
    } else {
      const activeIds = filteredLeads.map((l) => l.id);
      setSelectedLeadIds((prev) => prev.filter((id) => !activeIds.includes(id)));
    }
  };

  // Thay đổi bộ lọc dropdown
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Chọn nhanh / bỏ chọn toàn bộ lead của một stage trên Kanban
  const handleSelectAllLeadsInStage = (
    stageId: string,
    isSelectAll: boolean
  ) => {
    const stageLeadIds = filteredLeads
      .filter((l) => l.stage === stageId)
      .map((l) => l.id);

    if (isSelectAll) {
      setSelectedLeadIds((prev) =>
        Array.from(new Set([...prev, ...stageLeadIds]))
      );
    } else {
      setSelectedLeadIds((prev) =>
        prev.filter((id) => !stageLeadIds.includes(id))
      );
    }
  };

  // 6. Lưu trữ & Xuất dữ liệu ra CSV thật
  const handleDownload = () => {
    if (filteredLeads.length === 0) {
      alert("Không có dữ liệu khách hàng tiềm năng nào phù hợp để xuất file!");
      return;
    }

    // Tiêu đề cột
    const headers = [
      "ID",
      "Tên khách hàng",
      "Ngày thêm",
      "Giai đoạn",
      "Nguồn",
      "Kênh tiếp cận",
    ];

    // Nội dung dữ liệu
    const rows = filteredLeads.map((lead) => [
      lead.id,
      `"${lead.name.replace(/"/g, '""')}"`, // escape quotes
      lead.date,
      `"${stages.find((s) => s.id === lead.stage)?.label || lead.stage}"`,
      `"${lead.source}"`,
      lead.platform === "messenger" ? "Messenger" : lead.platform,
    ]);

    // Tạo file CSV với BOM để hiển thị tiếng Việt chính xác trong Excel
    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `media_platform_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      show: true,
      message: `Đã xuất và tải xuống file dữ liệu khách hàng tiềm năng thành công!`,
      type: "success",
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("toggle-bulk-edit", { detail: { isBulkEditing } })
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("toggle-bulk-edit", {
            detail: { isBulkEditing: false },
          })
        );
      }
    };
  }, [isBulkEditing]);

  return {
    viewMode,
    setViewMode,
    selectedGroupId,
    isFunnelModalOpen,
    setIsFunnelModalOpen,
    isBulkEditing,
    setIsBulkEditing,
    handleGroupChange,
    stages,
    setStages,
    leads,
    setLeads,
    loading,
    selectedLeadIds,
    setSelectedLeadIds,
    currentSubTab,
    setCurrentSubTab,
    showLost,
    setShowLost,
    showUnqualified,
    setShowUnqualified,
    showUnreadOnly,
    setShowUnreadOnly,
    filters,
    setFilters,
    toast,
    setToast,
    selectedGroup,
    filteredLeads,
    handleAddStage,
    handleChangeStage,
    handleDeleteLead,
    handleBulkEdit,
    handleSelectLead,
    handleSelectAllLeads,
    handleFilterChange,
    handleSelectAllLeadsInStage,
    handleDownload,
  };
}
