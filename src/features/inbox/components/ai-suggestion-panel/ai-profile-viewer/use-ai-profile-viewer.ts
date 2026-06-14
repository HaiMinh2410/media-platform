"use client";

import { useState, useEffect } from "react";
import {
  getFanPersonalityConfiguration,
  getConversationStageConfiguration,
  getNextActionConfiguration,
} from "../panel-constants";

export type UseAiProfileViewerProps = {
  fanProfile: any;
  gender: string | null;
};

export function useAiProfileViewer({ fanProfile, gender }: UseAiProfileViewerProps) {
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  // Chuẩn hóa dữ liệu hồ sơ fan
  const profile = fanProfile
    ? {
        fanType: fanProfile.fan_type || fanProfile.fanType || "Unknown",
        fanTypeConfidence:
          fanProfile.fan_type_confidence ?? fanProfile.fanTypeConfidence ?? 0,
        stage: fanProfile.stage || "G1",
        dayCount: fanProfile.day_count ?? fanProfile.dayCount ?? 0,
        messageCount: fanProfile.message_count ?? fanProfile.messageCount ?? 0,
        emotionScore:
          fanProfile.emotion_score ?? fanProfile.emotionScore ?? 0.5,
        emotionTrend:
          fanProfile.emotion_trend ?? fanProfile.emotionTrend ?? "stable",
        flirtLevel: fanProfile.flirt_level ?? fanProfile.flirtLevel ?? 0,
        riskLevel: fanProfile.risk_level ?? fanProfile.riskLevel ?? "low",
        nextAction:
          fanProfile.next_action ?? fanProfile.nextAction ?? "continue",
        keyInsights: fanProfile.key_insights ?? fanProfile.keyInsights ?? [],
        objectionsSeen:
          fanProfile.objections_seen ?? fanProfile.objectionsSeen ?? [],
        firstInteractedAt:
          fanProfile.firstInteractedAt || fanProfile.created_at || null,
        conversationId:
          fanProfile.conversation_id || fanProfile.conversationId || null,
      }
    : null;

  // Tải danh sách tin nhắn để so khớp regex tìm nguồn gốc rào cản (objections)
  useEffect(() => {
    if (!profile?.conversationId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/conversations/${profile.conversationId}/messages?limit=100`,
        );
        const json = await res.json();
        if (json.data) {
          setMessages(json.data);
        }
      } catch (err) {
        console.error(
          "[AiProfileViewer] Error loading messages for objections:",
          err,
        );
      }
    };
    fetchMessages();
  }, [profile?.conversationId, profile?.objectionsSeen?.length]);

  const fanConfig = profile
    ? getFanPersonalityConfiguration(profile.fanType)
    : null;
  const stageConfig = profile
    ? getConversationStageConfiguration(profile.stage)
    : null;
  const actionConfig = profile
    ? getNextActionConfiguration(profile.nextAction)
    : null;

  return {
    isProfileExpanded,
    setIsProfileExpanded,
    showInsights,
    setShowInsights,
    messages,
    profile,
    fanConfig,
    stageConfig,
    actionConfig,
  };
}
