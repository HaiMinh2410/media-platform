"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@shared/api/supabase/client";
import { SlidingTabs } from "@shared/ui";
import {
  clearWebhookLogsAction,
  getDatabaseStatsAction,
  getLogDetailsAction,
  simulateWebhookAction,
} from "./actions";

function JSONPretty({ data }: { data: any }) {
  if (typeof data !== "object" || data === null) {
    return <span className="text-success font-mono">{String(data)}</span>;
  }
  
  const jsonStr = JSON.stringify(data, null, 2);
  const lines = jsonStr.split("\n");
  return (
    <pre className="block text-left whitespace-pre select-all text-xs font-mono max-h-[300px] overflow-auto leading-relaxed text-base-content/80">
      {lines.map((line, i) => {
        const match = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/);
        if (match) {
          const [, indent, key, colon, valueStr] = match;
          let renderedVal: React.ReactNode = valueStr;
          
          const hasComma = valueStr.endsWith(",");
          const cleanVal = hasComma ? valueStr.slice(0, -1) : valueStr;
          
          if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
            renderedVal = <span className="text-success">{cleanVal}</span>;
          } else if (cleanVal === "true" || cleanVal === "false") {
            renderedVal = <span className="text-secondary">{cleanVal}</span>;
          } else if (cleanVal === "null") {
            renderedVal = <span className="text-base-content/40">{cleanVal}</span>;
          } else if (!isNaN(Number(cleanVal))) {
            renderedVal = <span className="text-warning">{cleanVal}</span>;
          }
          
          return (
            <div key={i}>
              {indent}
              <span className="text-info">"{key}"</span>
              {colon}
              {renderedVal}
              {hasComma && <span className="text-base-content/50">,</span>}
            </div>
          );
        }
        return <div key={i}>{line}</div>;
      })}
    </pre>
  );
}

type ConnectedAccount = {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_user_name: string;
};

type DevPanelProps = {
  workspaceId: string;
  connectedAccounts: ConnectedAccount[];
  verifyToken: string;
};

type DBStats = {
  rawLogs: number;
  parsedEvents: number;
  conversations: number;
  messages: number;
  platformAccounts: number;
};

type LogStreamItem = {
  id: string;
  platform: string;
  status: string;
  createdAt: string;
  payload: any;
  headers: any;
  webhookEvents?: {
    id: string;
    platform: string;
    externalSenderId: string;
    externalPageId: string;
    messageText: string | null;
    receivedAt: string;
  }[];
  associations?: {
    eventId: string;
    externalSenderId: string;
    messageText: string | null;
    conversation: {
      id: string;
      customerName: string | null;
      customerUsername: string | null;
      status: string | null;
      messages: {
        id: string;
        content: string;
        senderType: string | null;
        createdAt: string;
      }[];
    } | null;
  }[];
};

type WebhookPreset = "incoming" | "echo" | "read" | "custom";

export function DevPanel({
  workspaceId,
  connectedAccounts,
  verifyToken,
}: DevPanelProps) {
  // Preset State
  const [activePreset, setActivePreset] = useState<WebhookPreset>("incoming");
  const [senderId, setSenderId] = useState("sender_user_99");
  const [recipientId, setRecipientId] = useState(
    connectedAccounts.length > 0
      ? connectedAccounts[0].platform_user_id
      : "recipient_page_100",
  );
  const [messageText, setMessageText] = useState(
    "Xin chào, đây là tin nhắn thử nghiệm!",
  );
  const [payloadJson, setPayloadJson] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // DB Stats State
  const [stats, setStats] = useState<DBStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Live Stream State
  const [streamItems, setStreamItems] = useState<LogStreamItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LogStreamItem | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<"simulator" | "tester">(
    "simulator",
  );

  // Freeze Stream State
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenQueue, setFrozenQueue] = useState<LogStreamItem[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "incoming" | "echo" | "read" | "error">("all");

  // Custom API Test state
  const [apiEndpoint, setApiEndpoint] = useState("/api/health");
  const [apiMethod, setApiMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("GET");
  const [apiBody, setApiBody] = useState('{\n  "test": true\n}');
  const [apiHeaders, setApiHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [apiHeadersError, setApiHeadersError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // API Tester History State
  type ApiHistoryItem = {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    endpoint: string;
    body: string;
    headers: string;
    timestamp: number;
  };
  const [apiHistory, setApiHistory] = useState<ApiHistoryItem[]>([]);

  // References
  const supabaseRef = useRef<any>(null);
  const latestLogsRef = useRef<LogStreamItem[]>([]);

  latestLogsRef.current = streamItems;

  // 1. Fetch initial DB stats and load recent logs, load API history
  const loadStats = async () => {
    setStatsLoading(true);
    const res = await getDatabaseStatsAction();
    if (res.success && res.stats) {
      setStats(res.stats);
    } else {
      toast.error("Không thể tải thống kê cơ sở dữ liệu");
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    loadStats();
    // Load API history from localStorage
    const history = localStorage.getItem("dev_api_tester_history");
    if (history) {
      try {
        setApiHistory(JSON.parse(history));
      } catch (e) {
        console.error("Failed to parse API history", e);
      }
    }
  }, []);

  // 2. Manage Dynamic JSON Payload updates based on presets & validate custom JSON
  useEffect(() => {
    if (activePreset === "custom") {
      try {
        if (payloadJson.trim()) {
          JSON.parse(payloadJson);
          setJsonError(null);
        } else {
          setJsonError("Payload không được để trống");
        }
      } catch (e: any) {
        setJsonError(`JSON không hợp lệ: ${e.message}`);
      }
      return;
    }
    setJsonError(null);

    const selectedAccount = connectedAccounts.find(
      (acc) => acc.platform_user_id === recipientId,
    );
    const platform = selectedAccount?.platform || "facebook";
    const isInstagram = platform === "instagram";
    const objectType = isInstagram ? "instagram" : "page";
    const midPrefix = isInstagram ? "mid.ig." : "mid.fb.";

    let payload: any = {};
    const timestamp = Date.now();

    if (activePreset === "incoming") {
      payload = {
        object: objectType,
        entry: [
          {
            id: recipientId,
            time: Math.floor(timestamp / 1000),
            messaging: [
              {
                sender: { id: senderId },
                recipient: { id: recipientId },
                timestamp,
                message: {
                  mid: `${midPrefix}${Math.random().toString(36).slice(2, 15)}`,
                  text: messageText,
                },
              },
            ],
          },
        ],
      };
    } else if (activePreset === "echo") {
      payload = {
        object: objectType,
        entry: [
          {
            id: recipientId,
            time: Math.floor(timestamp / 1000),
            messaging: [
              {
                sender: { id: recipientId }, // echo sender is Page/IG itself
                recipient: { id: senderId }, // echo recipient is customer
                timestamp,
                message: {
                  mid: `${midPrefix}${Math.random().toString(36).slice(2, 15)}`,
                  is_echo: true,
                  text: messageText,
                },
              },
            ],
          },
        ],
      };
    } else if (activePreset === "read") {
      payload = {
        object: objectType,
        entry: [
          {
            id: recipientId,
            time: Math.floor(timestamp / 1000),
            messaging: [
              {
                sender: { id: senderId },
                recipient: { id: recipientId },
                timestamp,
                read: {
                  watermark: timestamp - 1000,
                },
              },
            ],
          },
        ],
      };
    }

    setPayloadJson(JSON.stringify(payload, null, 2));
  }, [activePreset, senderId, recipientId, messageText, connectedAccounts]);

  // Freeze state ref to avoid closure issues in Realtime listener
  const isFrozenRef = useRef(isFrozen);
  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  // 3. Supabase Realtime Log Streaming
  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    // Fetch details for newly inserted/updated logs
    const enrichLogData = async (logId: string) => {
      const res = await getLogDetailsAction(logId);

      if (res.success && res.log) {
        const enrichedLog: LogStreamItem = {
          id: res.log.id,
          platform: res.log.platform,
          status: res.log.status || "received",
          createdAt: res.log.createdAt.toString(),
          payload: res.log.payload,
          headers: res.log.headers,
          webhookEvents: (res.log.webhookEvents || []).map((ev: any) => ({
            id: ev.id,
            platform: ev.platform,
            externalSenderId: ev.externalSenderId,
            externalPageId: ev.externalPageId,
            messageText: ev.messageText,
            receivedAt: ev.receivedAt.toString(),
          })),
          associations:
            res.eventDetails?.map((ed: any) => ({
              eventId: ed.eventId,
              externalSenderId: ed.externalSenderId,
              messageText: ed.messageText,
              conversation: ed.conversation,
            })) || [],
        };

        if (isFrozenRef.current) {
          setFrozenQueue((prev) => {
            const exists = prev.some((item) => item.id === logId);
            if (exists) {
              return prev.map((item) => (item.id === logId ? enrichedLog : item));
            }
            return [enrichedLog, ...prev];
          });
        } else {
          setStreamItems((prev) => {
            const exists = prev.some((item) => item.id === logId);
            if (exists) {
              return prev.map((item) => (item.id === logId ? enrichedLog : item));
            }
            return [enrichedLog, ...prev];
          });
        }

        // Trigger stats refresh in background
        loadStats();
      }
    };

    console.log("[Realtime] Subscribing to platform_event_logs");

    const channel = supabase
      .channel("dev-logs-console")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE
          schema: "public",
          table: "platform_event_logs",
        },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;

          if (payload.eventType === "INSERT") {
            toast.info(
              `🔔 Nhận webhook raw: Platform [${newRow.platform.toUpperCase()}]`,
            );
            
            // Push immediately a minimal log to the UI
            const tempLog: LogStreamItem = {
              id: newRow.id,
              platform: newRow.platform,
              status: newRow.status || "received",
              createdAt: newRow.created_at || newRow.createdAt || new Date().toISOString(),
              payload: newRow.payload,
              headers: newRow.headers,
              webhookEvents: [],
              associations: [],
            };

            if (isFrozenRef.current) {
              setFrozenQueue((prev) => [tempLog, ...prev]);
            } else {
              setStreamItems((prev) => [tempLog, ...prev]);
            }

            enrichLogData(newRow.id);
          } else if (payload.eventType === "UPDATE") {
            console.log("[Realtime] Webhook Update received:", newRow.id);
            enrichLogData(newRow.id);
          }
        },
      )
      .subscribe((status) => {
        console.log("[Realtime] Channel subscription status:", status);
        setIsSubscribed(status === "SUBSCRIBED");
      });

    return () => {
      console.log("[Realtime] Unsubscribing channel");
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Send Mock Webhook POST request via Server Action
  const handleSendWebhook = async () => {
    try {
      setIsSending(true);

      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(payloadJson);
      } catch (e) {
        toast.error("JSON không hợp lệ! Vui lòng kiểm tra lại cấu trúc.");
        setIsSending(false);
        return;
      }

      toast.loading("Đang gửi webhook giả lập...");

      // Call secure Server Action instead of direct client HTTP fetch
      const res = await simulateWebhookAction(parsedPayload);

      toast.dismiss();

      if (res.success) {
        toast.success("Gửi webhook giả lập THÀNH CÔNG!");
      } else {
        toast.error(`Gửi webhook thất bại: ${res.error || "Unknown"}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        `Lỗi bất ngờ khi gửi: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSending(false);
    }
  };

  // 5. Delete all raw logs and parsed events from DB with 2-step confirmation
  const handleClearDbLogs = async () => {
    const confirmation = window.prompt(
      "CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu logs webhook trong cơ sở dữ liệu?\n\nVui lòng nhập 'TRUNCATE' để xác nhận hành động:"
    );

    if (confirmation !== "TRUNCATE") {
      toast.error("Hủy bỏ thao tác xóa (chưa xác nhận từ khóa TRUNCATE)");
      return;
    }

    const res = await clearWebhookLogsAction("TRUNCATE");
    if (res.success) {
      toast.success(res.message || "Đã dọn dẹp logs thành công!");
      setStreamItems([]);
      setSelectedItem(null);
      loadStats();
    } else {
      toast.error(`Dọn dẹp logs thất bại: ${res.error}`);
    }
  };

  // 6. Handle custom API execution
  const handleRunApiTest = async () => {
    setApiLoading(true);
    setApiResponse(null);

    // Verify Headers
    let parsedHeaders: Record<string, string> = {};
    if (apiHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(apiHeaders);
        setApiHeadersError(null);
      } catch (e) {
        setApiHeadersError("Headers không phải là JSON hợp lệ!");
        toast.error("Vui lòng sửa lỗi Headers JSON");
        setApiLoading(false);
        return;
      }
    }

    try {
      const options: RequestInit = {
        method: apiMethod,
        headers: {
          "Content-Type": "application/json",
          ...parsedHeaders
        }
      };

      if (apiMethod !== "GET" && apiBody) {
        try {
          JSON.parse(apiBody);
          options.body = apiBody;
        } catch (e) {
          toast.error("Body không phải là JSON hợp lệ!");
          setApiLoading(false);
          return;
        }
      }

      const res = await fetch(apiEndpoint, options);
      const data = (await res.json().catch(() => null)) || (await res.text());

      const resObj = {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      };
      setApiResponse(resObj);

      toast.success(`Chạy test API thành công: ${res.status}`);
      
      // Save to history
      const historyItem: ApiHistoryItem = {
        method: apiMethod,
        endpoint: apiEndpoint,
        body: apiBody,
        headers: apiHeaders,
        timestamp: Date.now()
      };
      
      setApiHistory(prev => {
        const filtered = prev.filter(h => !(h.endpoint === apiEndpoint && h.method === apiMethod));
        const newHistory = [historyItem, ...filtered].slice(0, 10);
        localStorage.setItem("dev_api_tester_history", JSON.stringify(newHistory));
        return newHistory;
      });

      loadStats();
    } catch (err: any) {
      setApiResponse({
        error: err.message || String(err),
      });
      toast.error("Gọi API thất bại");
    } finally {
      setApiLoading(false);
    }
  };

  // Helper to load history config into tester
  const loadHistoryRequest = (history: ApiHistoryItem) => {
    setApiMethod(history.method);
    setApiEndpoint(history.endpoint);
    setApiBody(history.body);
    setApiHeaders(history.headers);
    toast.info(`Nạp cấu hình API: ${history.method} ${history.endpoint}`);
  };

  // Toggle Freeze Stream function
  const handleToggleFreeze = () => {
    if (isFrozen) {
      // Release frozen queue to stream items
      setStreamItems((prev) => {
        const uniqueNew = frozenQueue.filter(newItem => !prev.some(oldItem => oldItem.id === newItem.id));
        return [...uniqueNew, ...prev];
      });
    }
    setIsFrozen(!isFrozen);
  };

  // Filter and search stream items
  const filteredStreamItems = streamItems.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.webhookEvents &&
        item.webhookEvents.some(
          (ev) =>
            ev.externalSenderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.externalPageId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ev.messageText &&
              ev.messageText.toLowerCase().includes(searchQuery.toLowerCase()))
        )) ||
      (item.associations &&
        item.associations.some(
          (assoc) =>
            assoc.externalSenderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (assoc.messageText &&
              assoc.messageText.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (assoc.conversation &&
              assoc.conversation.customerName &&
              assoc.conversation.customerName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        ));

    if (!matchesSearch) return false;
    if (filterType === "all") return true;
    if (filterType === "incoming") {
      return (
        item.payload?.entry?.[0]?.messaging?.[0]?.message?.is_echo !== true &&
        item.payload?.entry?.[0]?.messaging?.[0]?.message?.text !== undefined
      );
    }
    if (filterType === "echo") {
      return item.payload?.entry?.[0]?.messaging?.[0]?.message?.is_echo === true;
    }
    if (filterType === "read") {
      return item.payload?.entry?.[0]?.messaging?.[0]?.read !== undefined;
    }
    if (filterType === "error") {
      return item.status === "failed" || item.status === "error";
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row items-stretch min-h-[600px] w-full text-left">
      {/* COLUMN 1: CONTROLS (SIMULATOR & API TESTER) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* TAB CONTROLLERS */}
        <div className="self-start min-w-[280px]">
          <SlidingTabs
            items={[
              { value: "simulator", label: "Giả Lập Webhook" },
              { value: "tester", label: "Gọi API Direct" },
            ]}
            activeValue={activeTab}
            onChange={(val) => setActiveTab(val as "simulator" | "tester")}
            size="sm"
            fullWidth
            rounded="rounded-md"
            layoutId="devPanelActiveTab"
            className="bg-base-200 border border-base-content/5 p-1"
          />
        </div>

        {activeTab === "simulator" && (
          <div className="card bg-base-100 border border-base-content/5 shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-base font-bold tracking-tight text-base-content">
              Giả lập Webhook Meta (FB/IG)
            </h3>

            {/* PRESETS */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-base-content/60 font-semibold text-xs">
                  Payload Mẫu
                </span>
              </label>
              <select
                className="select select-bordered select-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content font-medium"
                value={activePreset}
                onChange={(e) =>
                  setActivePreset(e.target.value as WebhookPreset)
                }
              >
                <option value="incoming">
                  Tin nhắn đến (Incoming Message)
                </option>
                <option value="echo">
                  Tin nhắn đi (Echo - Bot/Agent reply)
                </option>
                <option value="read">Báo đã đọc (Read Receipt)</option>
                <option value="custom">Tùy chỉnh JSON Payload (Custom)</option>
              </select>
            </div>

            {activePreset !== "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SENDER */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-base-content/60 text-xs">
                      Sender ID (ID khách hàng)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-base-content"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                  />
                </div>

                {/* RECIPIENT */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-base-content/60 text-xs flex justify-between w-full">
                      <span>Recipient ID (Page/IG ID nhận)</span>
                      <span className="text-primary text-2xs font-semibold">
                        Khớp Account
                      </span>
                    </span>
                  </label>
                  {connectedAccounts.length > 0 ? (
                    <select
                      className="select select-bordered select-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-xs truncate max-w-full text-base-content"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                    >
                      {connectedAccounts.map((acc) => {
                        const shortId = acc.platform_user_id.length > 8
                          ? `...${acc.platform_user_id.slice(-6)}`
                          : acc.platform_user_id;
                        return (
                          <option key={acc.id} value={acc.platform_user_id}>
                            [{acc.platform.toUpperCase()}] {acc.platform_user_name} ({shortId})
                          </option>
                        );
                      })}
                      <option value="recipient_page_custom_id">
                        Custom Page ID...
                      </option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-warning text-base-content"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      placeholder="Nhập ID thủ công (Chưa liên kết TK)"
                    />
                  )}
                </div>

                {recipientId === "recipient_page_custom_id" && (
                  <div className="form-control w-full col-span-2">
                    <label className="label py-1">
                      <span className="label-text text-base-content/60 text-xs">
                        Custom Recipient Page ID
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-base-content"
                      value={
                        recipientId === "recipient_page_custom_id"
                          ? ""
                          : recipientId
                      }
                      onChange={(e) => setRecipientId(e.target.value)}
                      placeholder="Nhập ID Page thủ công..."
                    />
                  </div>
                )}

                {/* MESSAGE TEXT */}
                {activePreset !== "read" && (
                  <div className="form-control w-full col-span-2">
                    <label className="label py-1">
                      <span className="label-text text-base-content/60 text-xs">
                        Nội dung tin nhắn (Message Text)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* RAW JSON EDITOR */}
            <div className="form-control w-full flex-1">
              <label className="label py-1 flex justify-between">
                <span className="label-text text-base-content/60 font-semibold text-xs">
                  JSON Payload Gửi Đi
                </span>
                {activePreset === "custom" && (
                  <span className="text-2xs text-base-content/40">
                    Sửa trực tiếp bên dưới
                  </span>
                )}
              </label>
              <textarea
                className={`textarea textarea-bordered h-44 w-full rounded-md text-xs bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-base-content p-3 resize-y ${
                  jsonError ? "border-error/30 focus:border-error bg-error/5 text-error" : ""
                }`}
                value={payloadJson}
                onChange={(e) => {
                  setActivePreset("custom");
                  setPayloadJson(e.target.value);
                }}
              />
              {jsonError && (
                <span className="text-2xs text-error mt-1 font-semibold block text-left">
                  ⚠️ {jsonError}
                </span>
              )}
            </div>

            {/* ACTION TRIGGER BUTTON */}
            <button
              className={`btn btn-sm btn-primary text-primary-content font-bold w-full transition-all cursor-pointer ${
                isSending ? "loading animate-pulse" : ""
              }`}
              disabled={isSending || jsonError !== null}
              onClick={handleSendWebhook}
            >
              {isSending ? "Đang gửi Webhook..." : "⚡ GỬI WEBHOOK SIMULATE"}
            </button>
          </div>
        )}

        {activeTab === "tester" && (
          <div className="card bg-base-100 border border-base-content/5 shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-base font-bold tracking-tight text-base-content">
              Gọi API Endpoint Thủ Công
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-base-content/60 text-xs">
                    Method
                  </span>
                </label>
                <select
                  className="select select-bordered select-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content font-medium"
                  value={apiMethod}
                  onChange={(e) =>
                    setApiMethod(e.target.value as any)
                  }
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="form-control col-span-2">
                <label className="label py-1">
                  <span className="label-text text-base-content/60 text-xs">
                    Endpoint
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full rounded-md text-sm bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-base-content"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="/api/health"
                />
              </div>
            </div>

            {/* Custom Headers Input */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-base-content/60 text-xs">
                  Headers (JSON)
                </span>
              </label>
              <textarea
                className={`textarea textarea-bordered h-16 w-full rounded-md text-xs bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-base-content p-2 resize-y ${
                  apiHeadersError ? "border-error/30 focus:border-error bg-error/5 text-error" : ""
                }`}
                value={apiHeaders}
                onChange={(e) => {
                  setApiHeaders(e.target.value);
                  try {
                    if (e.target.value.trim()) {
                      JSON.parse(e.target.value);
                      setApiHeadersError(null);
                    } else {
                      setApiHeadersError(null);
                    }
                  } catch (err: any) {
                    setApiHeadersError(`JSON Header lỗi: ${err.message}`);
                  }
                }}
                placeholder='{\n  "Content-Type": "application/json"\n}'
              />
              {apiHeadersError && (
                <span className="text-2xs text-error mt-1 block text-left font-semibold">
                  ⚠️ {apiHeadersError}
                </span>
              )}
            </div>

            {apiMethod !== "GET" && (
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-base-content/60 text-xs">
                    Request JSON Body
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 w-full rounded-md text-xs bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all font-mono text-base-content p-3 resize-y"
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  placeholder='{\n  "key": "value"\n}'
                />
              </div>
            )}

            {/* API History List */}
            {apiHistory.length > 0 && (
              <div className="form-control w-full text-left">
                <label className="label py-0.5">
                  <span className="label-text text-base-content/40 text-xs font-bold uppercase tracking-wider font-mono">
                    Lịch sử cuộc gọi gần đây (History)
                  </span>
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-base-200/50 p-1.5 rounded border border-base-content/5">
                  {apiHistory.map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => loadHistoryRequest(h)}
                      className="btn btn-xs btn-ghost border border-base-content/5 font-mono text-xs lowercase max-w-[180px] truncate block text-left cursor-pointer text-base-content/80"
                      title={`${h.method} ${h.endpoint}`}
                    >
                      <span className="font-extrabold text-accent uppercase mr-1">{h.method}</span>
                      {h.endpoint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className={`btn btn-sm btn-accent text-accent-content font-bold w-full cursor-pointer ${apiLoading ? "loading" : ""}`}
              disabled={apiLoading || apiHeadersError !== null}
              onClick={handleRunApiTest}
            >
              {apiLoading ? "Đang chạy API..." : "🚀 CHẠY DIRECT API"}
            </button>

            {apiResponse && (
              <div className="flex flex-col gap-1.5 mt-2 text-left">
                <span className="text-xs font-semibold text-base-content/70">
                  Kết quả API Response:
                </span>
                <div className="bg-base-200/50 border border-base-content/5 rounded-md p-3 max-h-64 overflow-y-auto font-mono text-xs text-base-content/80">
                  <div className="flex gap-2 border-b border-base-content/5 pb-1 mb-2 font-bold justify-between">
                    <div className="flex gap-2">
                      <span className="text-success">
                        Status: {apiResponse.status}
                      </span>
                      <span className="text-base-content/40">|</span>
                      <span className="text-base-content/70 font-normal">
                        {apiResponse.statusText}
                      </span>
                    </div>
                  </div>
                  {apiResponse.data ? (
                    <JSONPretty data={apiResponse.data} />
                  ) : apiResponse.error ? (
                    <div className="text-error">Error: {apiResponse.error}</div>
                  ) : (
                    <div className="text-base-content/40">(Empty Response)</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATS PANEL */}
        <div className="card bg-base-100 border border-base-content/5 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-base-content/40">
              Database Statistics
            </h4>
            <button
              className={`btn btn-xs btn-ghost border border-base-content/5 cursor-pointer text-base-content/75 hover:bg-base-200 ${statsLoading ? "animate-spin" : ""}`}
              onClick={loadStats}
            >
              🔄 Refresh
            </button>
          </div>

          <div className="stats stats-vertical sm:stats-horizontal w-full bg-base-200/40 border border-base-content/5 shadow-inner rounded-xl mt-1">
            <div className="stat text-center p-3 sm:p-4">
              <div className="stat-title text-base-content/50 text-xs font-semibold uppercase tracking-wider whitespace-nowrap truncate" title="Raw Logs">
                Raw Logs
              </div>
              <div className="stat-value text-base font-mono font-extrabold text-base-content mt-0.5">
                {stats?.rawLogs ?? 0}
              </div>
            </div>

            <div className="stat text-center p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-base-content/5">
              <div className="stat-title text-base-content/50 text-xs font-semibold uppercase tracking-wider whitespace-nowrap truncate" title="Parsed Events">
                Parsed Events
              </div>
              <div className="stat-value text-base font-mono font-extrabold text-base-content mt-0.5">
                {stats?.parsedEvents ?? 0}
              </div>
            </div>

            <div className="stat text-center p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-base-content/5">
              <div className="stat-title text-base-content/50 text-xs font-semibold uppercase tracking-wider whitespace-nowrap truncate" title="Conversations">
                Conversations
              </div>
              <div className="stat-value text-base font-mono font-extrabold text-base-content mt-0.5">
                {stats?.conversations ?? 0}
              </div>
            </div>

            <div className="stat text-center p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-base-content/5">
              <div className="stat-title text-base-content/50 text-xs font-semibold uppercase tracking-wider whitespace-nowrap truncate" title="Messages">
                Messages
              </div>
              <div className="stat-value text-base font-mono font-extrabold text-base-content mt-0.5">
                {stats?.messages ?? 0}
              </div>
            </div>

            <div className="stat text-center p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-base-content/5">
              <div className="stat-title text-base-content/50 text-xs font-semibold uppercase tracking-wider whitespace-nowrap truncate" title="Accounts">
                Accounts
              </div>
              <div className="stat-value text-base font-mono font-extrabold text-base-content mt-0.5">
                {stats?.platformAccounts ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-2 text-2xs text-base-content/40 flex items-center justify-between">
            <span>
              Dữ liệu này được đọc trực tiếp từ database thông qua Prisma.
            </span>
            <button
              className="text-error hover:underline hover:text-error/80 font-bold cursor-pointer"
              onClick={handleClearDbLogs}
            >
              🗑️ Truncate Logs DB
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 2: REAL-TIME STREAM LOGS */}
      <div className="flex-[1.2] flex flex-col gap-4">
        <div className="card bg-base-100 border border-base-content/5 shadow-sm p-5 flex-1 flex flex-col min-h-[550px] max-h-[850px]">
          <div className="flex flex-col gap-3 mb-3 border-b border-base-content/5 pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-base-content">
                  Luồng webhook realtime
                </h3>
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${isSubscribed ? "bg-success animate-pulse" : "bg-error"}`}
                  title={
                    isSubscribed ? "Đã kết nối realtime" : "Chưa kết nối realtime"
                  }
                ></span>
              </div>
              <div className="flex gap-1.5">
                {/* Freeze Stream Toggle Button */}
                <button
                  onClick={handleToggleFreeze}
                  className={`btn btn-xs font-semibold cursor-pointer ${
                    isFrozen
                      ? "btn-error text-error-content animate-pulse"
                      : "btn-outline border-base-content/10 text-base-content/70"
                  }`}
                >
                  {isFrozen
                    ? `⏸️ Stream Frozen (${frozenQueue.length} mới)`
                    : "⏸️ Freeze Stream"}
                </button>
                <button
                  className="btn btn-xs btn-outline border-base-content/10 text-base-content/70 font-semibold cursor-pointer"
                  onClick={() => {
                    setStreamItems([]);
                    setSelectedItem(null);
                    setFrozenQueue([]);
                    toast.success("Đã dọn dẹp danh sách log hiển thị");
                  }}
                >
                  Clear Stream
                </button>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm ID, Sender, Msg..."
                className="input input-bordered input-sm flex-1 rounded-md text-xs bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="select select-bordered select-sm rounded-md text-xs bg-base-200 border-base-content/5 focus:bg-base-200/50 focus:border-primary/60 outline-none transition-all text-base-content font-semibold"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="all">Tất cả sự kiện</option>
                <option value="incoming">Tin nhắn đến (Incoming)</option>
                <option value="echo">Bot trả lời (Echo)</option>
                <option value="read">Báo đã đọc (Read)</option>
                <option value="error">Logs lỗi (Failed)</option>
              </select>
            </div>
          </div>

          {/* STREAM BODY */}
          <div className="flex-1 overflow-y-auto border border-base-content/5 bg-base-200/30 rounded-lg p-3 scrollbar-thin">
            {filteredStreamItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-base-content/50 gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  width="40"
                  className="opacity-30"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="font-semibold text-sm">
                  Không tìm thấy sự kiện webhook nào
                </div>
                <div className="text-xs text-base-content/40 max-w-xs">
                  {searchQuery || filterType !== "all"
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn."
                    : "Gửi webhook giả lập bên trái hoặc thao tác thật trên Facebook/Instagram để xem dữ liệu cập nhật realtime tại đây."}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredStreamItems.map((log: LogStreamItem) => {
                  const date = new Date(log.createdAt);
                  const displayTime =
                    date.toLocaleTimeString() +
                    "." +
                    String(date.getMilliseconds()).padStart(3, "0");
                  const parsedCount = log.webhookEvents?.length || 0;

                  return (
                    <div
                      key={log.id}
                      className={`border p-2.5 rounded-lg cursor-pointer transition-all text-left duration-200 ${
                        selectedItem?.id === log.id
                          ? "border-primary bg-primary/10"
                          : "border-base-content/5 bg-base-200/40 hover:bg-base-200/80"
                      }`}
                      onClick={() => setSelectedItem(log)}
                    >
                      <div className="flex justify-between items-center text-2xs font-mono mb-1">
                        <span className="text-base-content/40">
                          {displayTime}
                        </span>
                        <div className="flex gap-1">
                          <span
                            className={`badge badge-sm rounded uppercase font-extrabold border-0 ${
                              log.platform === "instagram"
                                ? "bg-instagram/10 text-instagram"
                                : "bg-facebook/10 text-facebook"
                            }`}
                          >
                            {log.platform}
                          </span>
                          <span
                            className={`badge badge-sm rounded uppercase font-extrabold border-0 ${
                              log.status === "received"
                                ? "badge-info animate-pulse"
                                : log.status === "failed" || log.status === "error"
                                ? "badge-error"
                                : "badge-success"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-mono font-semibold flex items-center justify-between text-base-content">
                        <span className="truncate max-w-[200px]">
                          ID: {log.id.slice(0, 8)}...
                        </span>
                        <span className="text-2xs text-base-content/50">
                          {parsedCount > 0
                            ? `✅ Parse: ${parsedCount} event`
                            : "❌ No parsed events"}
                        </span>
                      </div>

                      {/* Webhook event message preview */}
                      {log.webhookEvents && log.webhookEvents.length > 0 && (
                        <div className="mt-1.5 border-t border-base-content/5 pt-1.5 flex flex-col gap-1 text-xs font-mono text-base-content/60 text-left">
                          {log.webhookEvents.map((ev: any, i: number) => (
                            <div
                              key={i}
                              className="flex justify-between items-center gap-1"
                            >
                              <span className="text-base-content/40 truncate max-w-[150px]">
                                From: {ev.externalSenderId}
                              </span>
                              <span className="font-bold text-base-content truncate max-w-[220px]">
                                "{ev.messageText || "(Empty content/Read)"}"
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STREAM DETAIL PANEL (EXPANDED LOG ON CLICK) */}
          {selectedItem && (
            <div className="border-t border-base-content/10 pt-4 mt-4 flex flex-col gap-3 h-1/2 overflow-y-auto text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-base-content flex items-center gap-2">
                  🔍 Chi tiết Event Log
                  <span className="font-mono text-2xs bg-base-200 px-1.5 py-0.5 rounded border border-base-content/5 text-base-content/70">
                    {selectedItem.id.slice(0, 8)}
                  </span>
                </span>
                <button
                  className="btn btn-xs btn-ghost hover:bg-base-200 text-base-content/70 cursor-pointer"
                  onClick={() => setSelectedItem(null)}
                >
                  Đóng
                </button>
              </div>

              {/* TABS FOR DETAILS */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {/* 1. ASSOCIATIONS IN DATABASE (What models did this create?) */}
                {selectedItem.associations &&
                selectedItem.associations.length > 0 ? (
                  <div className="bg-success/5 border border-success/10 rounded-md p-3 text-xs font-mono flex flex-col gap-2">
                    <div className="font-bold text-success text-2xs uppercase tracking-wider">
                      📦 Liên kết Database & Pipeline
                    </div>

                    {selectedItem.associations.map((assoc, idx) => (
                      <div
                        key={idx}
                        className="border-t border-success/10 pt-2 first:border-0 first:pt-0 text-left"
                      >
                        <div className="flex justify-between">
                          <span className="text-base-content/60">
                            Parsed Event ID:
                          </span>
                          <span className="font-bold text-base-content">
                            {assoc.eventId.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-base-content/60">
                            Sender ID:
                          </span>
                          <span className="font-bold text-base-content">
                            {assoc.externalSenderId}
                          </span>
                        </div>

                        {assoc.conversation ? (
                          <div className="mt-1 bg-base-300/40 p-2.5 rounded-lg border border-base-content/5 flex flex-col gap-1.5">
                            <div className="flex justify-between text-success">
                              <span className="font-bold">
                                ✅ Conversation:
                              </span>
                              <span className="font-bold underline">
                                {assoc.conversation.customerName ||
                                  assoc.conversation.customerUsername ||
                                  "Khách"}
                              </span>
                            </div>
                            <div className="flex justify-between text-base-content/60">
                              <span>Convo ID:</span>
                              <span>
                                {assoc.conversation.id.slice(0, 8)}...
                              </span>
                            </div>
                            <div className="flex justify-between text-base-content/60">
                              <span>Status:</span>
                              <span className="badge badge-outline badge-xs text-base-content/60 uppercase font-extrabold">
                                {assoc.conversation.status}
                              </span>
                            </div>

                            <div className="mt-1 border-t border-base-content/5 pt-1.5">
                              <span className="font-bold text-base-content/60">
                                Các tin nhắn gần đây:
                              </span>
                              <div className="flex flex-col gap-1 mt-1 max-h-24 overflow-y-auto">
                                {assoc.conversation.messages
                                  .slice()
                                  .reverse()
                                  .map((msg) => (
                                    <div
                                      key={msg.id}
                                      className="flex justify-between bg-base-200/60 border border-base-content/5 p-1 rounded gap-1 text-xs"
                                    >
                                      <span
                                        className={
                                          msg.senderType === "user"
                                            ? "text-primary font-bold"
                                            : "text-base-content/40"
                                        }
                                      >
                                        {msg.senderType === "user"
                                          ? "Bot/NV:"
                                          : "Khách:"}
                                      </span>
                                      <span className="truncate text-base-content max-w-[200px]">
                                        "{msg.content}"
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-warning font-bold text-2xs mt-1">
                            ⚠️ Không tìm thấy Conversation tương ứng. Có thể
                            pipeline queue chưa chạy xong hoặc chưa khớp
                            platform_accounts!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-warning/5 border border-warning/10 rounded-md p-3 text-xs font-mono text-warning">
                    ℹ️ Log này chưa được phân tích thành WebhookEvent thành công
                    hoặc pipeline background chưa liên kết. Hãy đảm bảo Page
                    Recipient ID trùng với một trong các tài khoản đã kết nối!
                  </div>
                )}

                {/* 2. RAW LOG PAYLOAD JSON */}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs font-semibold text-base-content/70">
                    Raw JSON Payload:
                  </span>
                  <div className="bg-base-200/50 border border-base-content/5 p-3 rounded-md overflow-auto max-h-52 text-base-content/95 scrollbar-thin select-all">
                    <JSONPretty data={selectedItem.payload} />
                  </div>
                </div>

                {/* 3. HEADERS */}
                {selectedItem.headers && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-base-content/70">
                      Request Headers:
                    </span>
                    <div className="bg-base-200/40 border border-base-content/5 p-2 rounded-md overflow-auto max-h-40 text-base-content/70 scrollbar-thin select-all">
                      <JSONPretty data={selectedItem.headers} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
