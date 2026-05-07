'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/infrastructure/supabase/client';
import { 
  clearWebhookLogsAction, 
  getDatabaseStatsAction, 
  getLogDetailsAction 
} from './actions';

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

type WebhookPreset = 'incoming' | 'echo' | 'read' | 'custom';

export function DevPanel({ workspaceId, connectedAccounts, verifyToken }: DevPanelProps) {
  // Preset State
  const [activePreset, setActivePreset] = useState<WebhookPreset>('incoming');
  const [senderId, setSenderId] = useState('sender_user_99');
  const [recipientId, setRecipientId] = useState(
    connectedAccounts.length > 0 ? connectedAccounts[0].platform_user_id : 'recipient_page_100'
  );
  const [messageText, setMessageText] = useState('Xin chào, đây là tin nhắn thử nghiệm!');
  const [payloadJson, setPayloadJson] = useState('');
  const [isSending, setIsSending] = useState(false);

  // DB Stats State
  const [stats, setStats] = useState<DBStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Live Stream State
  const [streamItems, setStreamItems] = useState<LogStreamItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LogStreamItem | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'tester'>('simulator');
  
  // Custom API Test state
  const [apiEndpoint, setApiEndpoint] = useState('/api/health');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiBody, setApiBody] = useState('{\n  "test": true\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // References
  const supabaseRef = useRef<any>(null);
  const latestLogsRef = useRef<LogStreamItem[]>([]);

  latestLogsRef.current = streamItems;

  // 1. Fetch initial DB stats and load recent logs
  const loadStats = async () => {
    setStatsLoading(true);
    const res = await getDatabaseStatsAction();
    if (res.success && res.stats) {
      setStats(res.stats);
    } else {
      toast.error('Không thể tải thống kê cơ sở dữ liệu');
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 2. Manage Dynamic JSON Payload updates based on presets
  useEffect(() => {
    if (activePreset === 'custom') return;

    const selectedAccount = connectedAccounts.find(acc => acc.platform_user_id === recipientId);
    const platform = selectedAccount?.platform || 'facebook';
    const isInstagram = platform === 'instagram';
    const objectType = isInstagram ? 'instagram' : 'page';
    const midPrefix = isInstagram ? 'mid.ig.' : 'mid.fb.';

    let payload: any = {};
    const timestamp = Date.now();

    if (activePreset === 'incoming') {
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
                  text: messageText
                }
              }
            ]
          }
        ]
      };
    } else if (activePreset === 'echo') {
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
                  text: messageText
                }
              }
            ]
          }
        ]
      };
    } else if (activePreset === 'read') {
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
                  watermark: timestamp - 1000
                }
              }
            ]
          }
        ]
      };
    }

    setPayloadJson(JSON.stringify(payload, null, 2));
  }, [activePreset, senderId, recipientId, messageText, connectedAccounts]);

  // 3. Supabase Realtime Log Streaming
  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    // Fetch details for newly inserted logs
    const enrichAndAddLog = async (logId: string, initialData: any) => {
      // Wait briefly (500ms) for background pipeline to process the webhook
      await new Promise(resolve => setTimeout(resolve, 600));

      const res = await getLogDetailsAction(logId);
      
      if (res.success && res.log) {
        const enrichedLog: LogStreamItem = {
          id: res.log.id,
          platform: res.log.platform,
          status: res.log.status || 'received',
          createdAt: res.log.createdAt.toString(),
          payload: res.log.payload,
          headers: res.log.headers,
          webhookEvents: (res.log.webhookEvents || []).map((ev: any) => ({
            id: ev.id,
            platform: ev.platform,
            externalSenderId: ev.externalSenderId,
            externalPageId: ev.externalPageId,
            messageText: ev.messageText,
            receivedAt: ev.receivedAt.toString()
          })),
          associations: res.eventDetails?.map((ed: any) => ({
            eventId: ed.eventId,
            externalSenderId: ed.externalSenderId,
            messageText: ed.messageText,
            conversation: ed.conversation
          })) || []
        };

        setStreamItems(prev => {
          // Prevent duplicates
          if (prev.some(item => item.id === logId)) return prev;
          return [enrichedLog, ...prev];
        });

        // Trigger stats refresh in background
        loadStats();
      } else {
        // Add minimal log if enrichment failed
        const fallbackLog: LogStreamItem = {
          id: initialData.id,
          platform: initialData.platform,
          status: initialData.status || 'received',
          createdAt: initialData.created_at || initialData.createdAt || new Date().toISOString(),
          payload: initialData.payload,
          headers: initialData.headers
        };
        setStreamItems(prev => [fallbackLog, ...prev]);
      }
    };

    console.log('[Realtime] Subscribing to platform_event_logs');
    
    const channel = supabase
      .channel('dev-logs-console')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'platform_event_logs'
        },
        (payload) => {
          console.log('[Realtime] Webhook Insert received:', payload);
          const newRow = payload.new as any;
          
          toast.info(`🔔 Webhook raw mới nhận: Platform [${newRow.platform.toUpperCase()}]`);
          enrichAndAddLog(newRow.id, newRow);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Channel subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Realtime] Unsubscribing channel');
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Send Mock Webhook POST request
  const handleSendWebhook = async () => {
    try {
      setIsSending(true);
      
      // Parse payload to ensure it is valid JSON
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(payloadJson);
      } catch (e) {
        toast.error('JSON không hợp lệ! Vui lòng kiểm tra lại cấu trúc.');
        setIsSending(false);
        return;
      }

      toast.loading('Đang gửi webhook giả lập...');

      // Post raw payload directly to local webhook endpoint
      const response = await fetch('/api/webhooks/meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=mock_signature_from_dev_console_to_skip_verify_via_env'
        },
        body: JSON.stringify(parsedPayload)
      });

      toast.dismiss();

      const resBody = await response.json();

      if (response.ok) {
        toast.success('Gửi webhook giả lập THÀNH CÔNG!');
      } else {
        toast.error(`Gửi webhook thất bại: ${response.status} - ${resBody.error || 'Unknown'}`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`Lỗi bất ngờ khi gửi: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Delete all raw logs and parsed events from DB
  const handleClearDbLogs = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu logs webhook trong cơ sở dữ liệu? Thao tác này không thể phục hồi.')) {
      return;
    }

    const res = await clearWebhookLogsAction();
    if (res.success) {
      toast.success(res.message || 'Đã dọn dẹp logs thành công!');
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

    try {
      const options: RequestInit = {
        method: apiMethod,
      };

      if (apiMethod === 'POST' && apiBody) {
        try {
          JSON.parse(apiBody);
          options.body = apiBody;
          options.headers = {
            'Content-Type': 'application/json'
          };
        } catch (e) {
          toast.error('Body POST không phải là JSON hợp lệ!');
          setApiLoading(false);
          return;
        }
      }

      const res = await fetch(apiEndpoint, options);
      const data = await res.json().catch(() => null) || await res.text();

      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data
      });

      toast.success(`Chạy test API thành công: ${res.status}`);
      loadStats();
    } catch (err: any) {
      setApiResponse({
        error: err.message || String(err)
      });
      toast.error('Gọi API thất bại');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row items-stretch min-h-[600px] w-full">
      {/* COLUMN 1: CONTROLS (SIMULATOR & API TESTER) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* TAB CONTROLLERS */}
        <div className="tabs tabs-boxed bg-background-secondary p-1 rounded-md self-start border border-foreground/5">
          <button 
            className={`tab tab-sm font-semibold rounded-md transition-all ${activeTab === 'simulator' ? 'tab-active bg-accent-primary text-white' : 'text-foreground-secondary'}`}
            onClick={() => setActiveTab('simulator')}
          >
            Giả Lập Webhook
          </button>
          <button 
            className={`tab tab-sm font-semibold rounded-md transition-all ${activeTab === 'tester' ? 'tab-active bg-accent-primary text-white' : 'text-foreground-secondary'}`}
            onClick={() => setActiveTab('tester')}
          >
            Gọi API Direct
          </button>
        </div>

        {activeTab === 'simulator' && (
          <div className="glass p-5 rounded-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Giả lập Webhook Meta (FB/IG)</h3>

            {/* PRESETS */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-foreground-secondary font-semibold text-xs">Payload Mẫu</span>
              </label>
              <select 
                className="select select-bordered select-sm w-full bg-background font-medium focus:outline-none"
                value={activePreset}
                onChange={(e) => setActivePreset(e.target.value as WebhookPreset)}
              >
                <option value="incoming">Tin nhắn đến (Incoming Message)</option>
                <option value="echo">Tin nhắn đi (Echo - Bot/Agent reply)</option>
                <option value="read">Báo đã đọc (Read Receipt)</option>
                <option value="custom">Tùy chỉnh JSON Payload (Custom)</option>
              </select>
            </div>

            {activePreset !== 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SENDER */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-foreground-secondary text-xs">Sender ID (ID khách hàng)</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered input-sm w-full bg-background focus:outline-none font-mono"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                  />
                </div>

                {/* RECIPIENT */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-foreground-secondary text-xs flex justify-between">
                      <span>Recipient ID (Page/IG ID nhận)</span>
                      <span className="text-accent-primary text-3xs font-semibold">Khớp Account</span>
                    </span>
                  </label>
                  {connectedAccounts.length > 0 ? (
                    <select
                      className="select select-bordered select-sm w-full bg-background focus:outline-none font-mono"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                    >
                      {connectedAccounts.map((acc) => (
                        <option key={acc.id} value={acc.platform_user_id}>
                          [{acc.platform.toUpperCase()}] {acc.platform_user_name} ({acc.platform_user_id})
                        </option>
                      ))}
                      <option value="recipient_page_custom_id">Custom Page ID...</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      className="input input-bordered input-sm w-full bg-background focus:outline-none font-mono text-yellow-500"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      placeholder="Nhập ID thủ công (Chưa liên kết TK)"
                    />
                  )}
                </div>

                {recipientId === 'recipient_page_custom_id' && (
                  <div className="form-control w-full col-span-2">
                    <label className="label py-1">
                      <span className="label-text text-foreground-secondary text-xs">Custom Recipient Page ID</span>
                    </label>
                    <input 
                      type="text" 
                      className="input input-bordered input-sm w-full bg-background focus:outline-none font-mono"
                      value={recipientId === 'recipient_page_custom_id' ? '' : recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      placeholder="Nhập ID Page thủ công..."
                    />
                  </div>
                )}

                {/* MESSAGE TEXT */}
                {activePreset !== 'read' && (
                  <div className="form-control w-full col-span-2">
                    <label className="label py-1">
                      <span className="label-text text-foreground-secondary text-xs">Nội dung tin nhắn (Message Text)</span>
                    </label>
                    <input 
                      type="text" 
                      className="input input-bordered input-sm w-full bg-background focus:outline-none"
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
                <span className="label-text text-foreground-secondary font-semibold text-xs">JSON Payload Gửi Đi</span>
                {activePreset === 'custom' && (
                  <span className="text-3xs text-foreground-tertiary">Sửa trực tiếp bên dưới</span>
                )}
              </label>
              <textarea 
                className="textarea textarea-bordered h-44 w-full bg-background font-mono text-xs p-3 focus:outline-none focus:border-accent-primary"
                value={payloadJson}
                onChange={(e) => {
                  setActivePreset('custom');
                  setPayloadJson(e.target.value);
                }}
              />
            </div>

            {/* ACTION TRIGGER BUTTON */}
            <button 
              className={`btn btn-sm btn-primary text-white font-bold w-full transition-all ${isSending ? 'loading' : ''}`}
              disabled={isSending}
              onClick={handleSendWebhook}
            >
              {isSending ? 'Đang gửi Webhook...' : '⚡ GỬI WEBHOOK SIMULATE'}
            </button>
          </div>
        )}

        {activeTab === 'tester' && (
          <div className="glass p-5 rounded-lg flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Gọi API Endpoint Thủ Công</h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-foreground-secondary text-xs">Method</span>
                </label>
                <select 
                  className="select select-bordered select-sm bg-background font-medium focus:outline-none"
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as 'GET' | 'POST')}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="form-control col-span-2">
                <label className="label py-1">
                  <span className="label-text text-foreground-secondary text-xs">Endpoint</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered input-sm bg-background focus:outline-none font-mono"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="/api/health"
                />
              </div>
            </div>

            {apiMethod === 'POST' && (
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-foreground-secondary text-xs">Request JSON Body</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered h-28 w-full bg-background font-mono text-xs p-3 focus:outline-none"
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                />
              </div>
            )}

            <button 
              className={`btn btn-sm btn-accent text-white font-bold w-full ${apiLoading ? 'loading' : ''}`}
              disabled={apiLoading}
              onClick={handleRunApiTest}
            >
              {apiLoading ? 'Đang chạy API...' : '🚀 CHẠY DIRECT API'}
            </button>

            {apiResponse && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs font-semibold text-foreground-secondary">Kết quả API Response:</span>
                <div className="bg-black/40 border border-foreground/5 rounded-md p-3 max-h-56 overflow-y-auto font-mono text-2xs text-foreground/80">
                  <div className="flex gap-2 border-b border-foreground/5 pb-1 mb-2 font-bold">
                    <span className="text-success">Status: {apiResponse.status}</span>
                    <span className="text-foreground-tertiary">|</span>
                    <span className="text-foreground-secondary">{apiResponse.statusText}</span>
                  </div>
                  <pre>{JSON.stringify(apiResponse.data, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATS PANEL */}
        <div className="glass p-5 rounded-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-foreground-secondary">Database Statistics</h4>
            <button 
              className={`btn btn-xs btn-ghost border border-foreground/5 ${statsLoading ? 'animate-spin' : ''}`}
              onClick={loadStats}
            >
              🔄 Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-1">
            <div className="bg-foreground/5 border border-foreground/5 p-3 rounded-lg text-center">
              <div className="text-foreground-secondary text-4xs font-bold uppercase">Raw Logs</div>
              <div className="text-lg font-mono font-extrabold text-foreground mt-0.5">{stats?.rawLogs ?? 0}</div>
            </div>
            <div className="bg-foreground/5 border border-foreground/5 p-3 rounded-lg text-center">
              <div className="text-foreground-secondary text-4xs font-bold uppercase">Parsed Events</div>
              <div className="text-lg font-mono font-extrabold text-foreground mt-0.5">{stats?.parsedEvents ?? 0}</div>
            </div>
            <div className="bg-foreground/5 border border-foreground/5 p-3 rounded-lg text-center">
              <div className="text-foreground-secondary text-4xs font-bold uppercase">Conversations</div>
              <div className="text-lg font-mono font-extrabold text-foreground mt-0.5">{stats?.conversations ?? 0}</div>
            </div>
            <div className="bg-foreground/5 border border-foreground/5 p-3 rounded-lg text-center">
              <div className="text-foreground-secondary text-4xs font-bold uppercase">Messages</div>
              <div className="text-lg font-mono font-extrabold text-foreground mt-0.5">{stats?.messages ?? 0}</div>
            </div>
            <div className="bg-foreground/5 border border-foreground/5 p-3 rounded-lg text-center col-span-2 md:col-span-1">
              <div className="text-foreground-secondary text-4xs font-bold uppercase">Accounts</div>
              <div className="text-lg font-mono font-extrabold text-foreground mt-0.5">{stats?.platformAccounts ?? 0}</div>
            </div>
          </div>

          <div className="mt-2 text-3xs text-foreground-tertiary flex items-center justify-between">
            <span>Dữ liệu này được đọc trực tiếp từ database thông qua Prisma.</span>
            <button 
              className="text-red-400 hover:underline hover:text-red-500 font-bold"
              onClick={handleClearDbLogs}
            >
              🗑️ Truncate Logs DB
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 2: REAL-TIME STREAM LOGS */}
      <div className="flex-[1.2] flex flex-col gap-4">
        <div className="glass p-5 rounded-lg flex-1 flex flex-col min-h-[550px] max-h-[850px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Luồng webhook realtime</h3>
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${isSubscribed ? 'bg-success animate-pulse' : 'bg-red-500'}`} title={isSubscribed ? "Đã kết nối realtime" : "Chưa kết nối realtime"}></span>
            </div>
            <div className="flex gap-1.5">
              <button 
                className="btn btn-xs btn-outline border-foreground/10 text-foreground-secondary font-semibold"
                onClick={() => {
                  setStreamItems([]);
                  setSelectedItem(null);
                  toast.success('Đã dọn dẹp danh sách log hiển thị');
                }}
              >
                Clear Stream
              </button>
            </div>
          </div>

          {/* STREAM BODY */}
          <div className="flex-1 overflow-y-auto border border-foreground/5 bg-black/40 rounded-lg p-3 scrollbar-thumb-foreground/10">
            {streamItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-foreground-secondary gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="40" className="opacity-30">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="font-semibold text-sm">Chưa có sự kiện webhook nào trong phiên này</div>
                <div className="text-xs text-foreground-tertiary max-w-xs">
                  Gửi webhook giả lập bên trái hoặc thao tác thật trên Facebook/Instagram để xem dữ liệu cập nhật realtime tại đây.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {streamItems.map((log) => {
                  const date = new Date(log.createdAt);
                  const displayTime = date.toLocaleTimeString() + '.' + String(date.getMilliseconds()).padStart(3, '0');
                  const parsedCount = log.webhookEvents?.length || 0;
                  
                  return (
                    <div 
                      key={log.id}
                      className={`border p-2.5 rounded-lg cursor-pointer transition-all hover:bg-foreground/5 ${
                        selectedItem?.id === log.id 
                          ? 'border-accent-primary bg-foreground/5' 
                          : 'border-foreground/5 bg-foreground/2'
                      }`}
                      onClick={() => setSelectedItem(log)}
                    >
                      <div className="flex justify-between items-center text-3xs font-mono mb-1">
                        <span className="text-foreground-tertiary">{displayTime}</span>
                        <div className="flex gap-1">
                          <span className={`px-1.5 py-0.5 rounded uppercase font-extrabold ${
                            log.platform === 'instagram' ? 'bg-instagram/10 text-instagram' : 'bg-facebook/10 text-facebook'
                          }`}>
                            {log.platform}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded uppercase font-extrabold ${
                            log.status === 'received' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-mono font-semibold flex items-center justify-between text-foreground">
                        <span className="truncate max-w-[200px]">ID: {log.id.slice(0, 8)}...</span>
                        <span className="text-3xs text-foreground-secondary">
                          {parsedCount > 0 ? `✅ Parse: ${parsedCount} event` : '❌ No parsed events'}
                        </span>
                      </div>

                      {/* Webhook event message preview */}
                      {log.webhookEvents && log.webhookEvents.length > 0 && (
                        <div className="mt-1.5 border-t border-foreground/5 pt-1 flex flex-col gap-0.5 text-2xs font-mono text-foreground-secondary">
                          {log.webhookEvents.map((ev, i) => (
                            <div key={i} className="flex justify-between items-center gap-1">
                              <span className="text-foreground-tertiary truncate max-w-[150px]">From: {ev.externalSenderId}</span>
                              <span className="font-bold text-foreground truncate max-w-[220px]">
                                "{ev.messageText || '(Empty content/Read)'}"
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
            <div className="border-t border-foreground/10 pt-4 mt-4 flex flex-col gap-3 h-1/2 overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-foreground flex items-center gap-2">
                  🔍 Chi tiết Event Log
                  <span className="font-mono text-3xs bg-foreground/10 px-1 rounded">{selectedItem.id.slice(0, 8)}</span>
                </span>
                <button 
                  className="btn btn-3xs btn-ghost hover:bg-foreground/5 text-foreground-secondary"
                  onClick={() => setSelectedItem(null)}
                >
                  Đóng
                </button>
              </div>

              {/* TABS FOR DETAILS */}
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {/* 1. ASSOCIATIONS IN DATABASE (What models did this create?) */}
                {selectedItem.associations && selectedItem.associations.length > 0 ? (
                  <div className="bg-success/5 border border-success/20 rounded-md p-3 text-2xs font-mono flex flex-col gap-2">
                    <div className="font-bold text-success text-3xs uppercase tracking-wider">📦 Liên kết Database & Pipeline</div>
                    
                    {selectedItem.associations.map((assoc, idx) => (
                      <div key={idx} className="border-t border-success/10 pt-2 first:border-0 first:pt-0">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Parsed Event ID:</span>
                          <span className="font-bold text-foreground">{assoc.eventId.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Sender ID:</span>
                          <span className="font-bold text-foreground">{assoc.externalSenderId}</span>
                        </div>

                        {assoc.conversation ? (
                          <div className="mt-1 bg-black/30 p-2 rounded flex flex-col gap-1">
                            <div className="flex justify-between text-success">
                              <span className="font-bold">✅ Conversation:</span>
                              <span className="font-bold underline">{assoc.conversation.customerName || assoc.conversation.customerUsername || 'Khách'}</span>
                            </div>
                            <div className="flex justify-between text-foreground-secondary">
                              <span>Convo ID:</span>
                              <span>{assoc.conversation.id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between text-foreground-secondary">
                              <span>Status:</span>
                              <span className="badge badge-3xs badge-outline uppercase font-extrabold">{assoc.conversation.status}</span>
                            </div>

                            <div className="mt-1 border-t border-foreground/5 pt-1">
                              <span className="font-bold text-foreground-secondary">Các tin nhắn gần đây:</span>
                              <div className="flex flex-col gap-1 mt-1 max-h-24 overflow-y-auto">
                                {assoc.conversation.messages.slice().reverse().map((msg) => (
                                  <div key={msg.id} className="flex justify-between bg-foreground/2 p-1 rounded gap-1 text-[10px]">
                                    <span className={msg.senderType === 'user' ? 'text-accent-primary font-bold' : 'text-foreground-tertiary'}>
                                      {msg.senderType === 'user' ? 'Bot/NV:' : 'Khách:'}
                                    </span>
                                    <span className="truncate text-foreground max-w-[200px]">"{msg.content}"</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-yellow-500 font-bold text-3xs mt-1">
                            ⚠️ Không tìm thấy Conversation tương ứng. Có thể pipeline queue chưa chạy xong hoặc chưa khớp platform_accounts!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md p-3 text-2xs font-mono text-yellow-500">
                    ℹ️ Log này chưa được phân tích thành WebhookEvent thành công hoặc pipeline background chưa liên kết. Hãy đảm bảo Page Recipient ID trùng với một trong các tài khoản đã kết nối!
                  </div>
                )}

                {/* 2. RAW LOG PAYLOAD JSON */}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-2xs font-semibold text-foreground-secondary">Raw JSON Payload:</span>
                  <pre className="bg-black/60 border border-foreground/5 p-3 rounded-md text-3xs font-mono overflow-auto max-h-52 text-foreground/90 scrollbar-thumb-foreground/10 select-all">
                    {JSON.stringify(selectedItem.payload, null, 2)}
                  </pre>
                </div>

                {/* 3. HEADERS */}
                {selectedItem.headers && (
                  <div className="flex flex-col gap-1">
                    <span className="text-2xs font-semibold text-foreground-secondary">Request Headers:</span>
                    <pre className="bg-black/40 border border-foreground/5 p-2 rounded-md text-3xs font-mono overflow-auto text-foreground-tertiary select-all">
                      {JSON.stringify(selectedItem.headers, null, 2)}
                    </pre>
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
