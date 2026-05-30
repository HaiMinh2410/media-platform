"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAISummary,
  AISummary,
} from "@features/dashboard/actions/dashboard.actions";
import { createClient } from "@shared/api/supabase/client";

interface UseAISummaryParams {
  workspaceId: string;
  initialData?: AISummary;
}

export function useAISummary({ workspaceId, initialData }: UseAISummaryParams) {
  const [data, setData] = useState<AISummary | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [isDrafting, setIsDrafting] = useState(false);

  // Hàm tải dữ liệu thống kê dùng chung giữa mount và realtime event
  const fetchSummaryData = useCallback(async () => {
    try {
      const result = await getAISummary(workspaceId);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch AI summary:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to realtime changes in messages and ai_reply_logs
    const channel = supabase
      .channel("dashboard_ai_drafting_status")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as {
            sender_type?: string;
            senderType?: string;
          };
          // If a new customer message is inserted, AI is triggered to draft a response
          if (row.sender_type === "user" || row.senderType === "user") {
            setIsDrafting(true);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_reply_logs" },
        () => {
          // AI has finished drafting the reply
          setIsDrafting(false);
          // Tự động cập nhật lại số liệu thống kê thời gian thực!
          fetchSummaryData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSummaryData]);

  // Safeguard: auto-reset drafting state after 8 seconds in case worker fails or timeouts
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isDrafting) {
      timeoutId = setTimeout(() => setIsDrafting(false), 8000);
    }
    return () => clearTimeout(timeoutId);
  }, [isDrafting]);

  useEffect(() => {
    if (initialData) return;
    fetchSummaryData();
  }, [fetchSummaryData, initialData]);

  return { data, loading, isDrafting };
}
