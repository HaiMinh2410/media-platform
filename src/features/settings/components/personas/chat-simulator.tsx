"use client";

import { Icon, RangeSelector } from "@shared/ui";
import { cn } from "@shared/lib";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Copy, Check, Gem, RotateCcw, Venus, Mars } from "lucide-react";
import { toast } from "sonner";

interface ChatSimulatorProps {
  accountId: string;
  accountName: string;
  personaDraft: {
    name?: string;
    gender?: string;
    custom_instructions?: string;
    system_prompt_override?: string;
    [key: string]: unknown;
  };
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  debug?: {
    action?: string;
    reasoning?: string;
    confidence?: number;
    systemPrompt?: string;
    userPrompt?: string;
    isError?: boolean;
  };
};

export function ChatSimulator({ accountId, personaDraft }: ChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "Cho mình xin giá sản phẩm nhé",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [customerGender, setCustomerGender] = useState<string | null>(null);
  const [mockScenario, setMockScenario] = useState<string>("none");

  const applyScenario = async (scenario: "none" | "male_senior" | "female_young" | "vip_inquiry") => {
    setMockScenario(scenario);
    let gender: string | null = null;
    let initialMessage = "";

    if (scenario === "male_senior") {
      gender = "male";
      initialMessage = "Chào em, anh là Nam. Nghe nói bên mình có dịch vụ nào đặc biệt không?";
    } else if (scenario === "female_young") {
      gender = "female";
      initialMessage = "Chị chào em nha, chị muốn tìm hiểu thêm về gói đăng ký.";
    } else if (scenario === "vip_inquiry") {
      gender = "male";
      initialMessage = "Gói VIP của bên em bao gồm những gì thế? Anh muốn mua trực tiếp.";
    } else {
      gender = null;
      initialMessage = "Cho mình xin giá sản phẩm nhé";
    }

    setCustomerGender(gender);
    
    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: initialMessage,
    };
    setMessages([newMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`/api/ai-personas/simulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          persona: personaDraft,
          incomingMessage: initialMessage,
          history: [],
          customerGender: gender,
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error ${res.status}`);
      }

      const data = await res.json();

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Dạ vâng ạ.",
        debug: {
          action: data.action,
          reasoning: data.reasoning,
          confidence: data.confidence,
          systemPrompt: data.systemPrompt,
          userPrompt: data.userPrompt,
          isError: data.isError,
        },
      };

      setMessages([newMsg, newAiMsg]);
    } catch (error) {
      console.warn("Simulator API error/fallback:", error);
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Disconnected: Không kết nối được API Simulator. Vui lòng kiểm tra Server Log!`,
          debug: {
            action: "continue",
            reasoning: "API error, fallback mock response.",
            confidence: 0.95,
            isError: true,
          },
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setIsTyping(false);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  const [activeInspectTab, setActiveInspectTab] = useState<"system" | "user">("system");
  const [selectedDebugData, setSelectedDebugData] = useState<{
    systemPrompt?: string;
    userPrompt?: string;
  } | null>(null);
  const [isInspectCopied, setIsInspectCopied] = useState(false);
  const inspectDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleInspectPrompt = (debug: NonNullable<Message["debug"]>) => {
    setSelectedDebugData(debug);
    setActiveInspectTab("system");
    setIsInspectCopied(false);
    inspectDialogRef.current?.showModal();
  };

  const handleCopyInspect = async () => {
    if (!selectedDebugData) return;
    const textToCopy =
      activeInspectTab === "system"
        ? selectedDebugData.systemPrompt
        : selectedDebugData.userPrompt;
    
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsInspectCopied(true);
      toast.success("Đã sao chép prompt!");
      setTimeout(() => setIsInspectCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép prompt.");
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Create a simplified history array
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`/api/ai-personas/simulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          persona: personaDraft,
          incomingMessage: newUserMsg.content,
          history,
          customerGender,
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error ${res.status}`);
      }

      const data = await res.json();

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Dạ vâng ạ.",
        debug: {
          action: data.action,
          reasoning: data.reasoning,
          confidence: data.confidence,
          systemPrompt: data.systemPrompt,
          userPrompt: data.userPrompt,
          isError: data.isError,
        },
      };

      setMessages((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.warn("Simulator API error/fallback:", error);
      // Fallback mock response if API fails/not implemented yet
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Disconnected: Không kết nối được API Simulator. Vui lòng kiểm tra Server Log!`,
          debug: {
            action: "send_price",
            reasoning: "User asked for price, providing mock data.",
            confidence: 0.95,
            isError: true,
          },
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-base-100 relative">
      {/* Toolbar chọn ngữ cảnh nhanh */}
      <div className="px-4 py-2 border-y border-base-content/5 flex flex-wrap gap-2 items-center justify-between">
        <span className="text-sm text-base-content/60 tracking-wide">Mockup Context:</span>
        <RangeSelector
          value={mockScenario}
          onChange={(val) => applyScenario(val as "none" | "male_senior" | "female_young" | "vip_inquiry")}
          options={[
            {
              id: "male_senior",
              label: "Nam lớn",
              icon: (cls) => <Mars className={cls} />,
            },
            {
              id: "female_young",
              label: "Nữ lớn (Chị)",
              icon: (cls) => <Venus className={cls} />,
            },
            {
              id: "vip_inquiry",
              label: "Hỏi VIP",
              icon: (cls) => <Gem className={cls} />,
            },
            {
              id: "none",
              label: "Mặc định (Reset)",
              icon: (cls) => <RotateCcw className={cls} />,
              dividerBefore: true,
            },
          ]}
          size="xs"
          menuMinWidth="w-44"
          menuAlign="right"
          triggerClassName="bg-soft rounded-md"
          dropdownClassName="bg-soft border-base-content/10 rounded-lg"
        />
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-custom"
        ref={scrollRef}
      >
        <div className="text-center text-sm text-base-content/40  mb-4">
          Bắt đầu phiên giả lập với {personaDraft.name || "Persona"}
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "chat",
              msg.role === "user" ? "chat-end" : "chat-start",
            )}
          >
            {msg.role === "assistant" && (
              <div className="chat-image avatar">
                <Icon lucide={Bot} size={16} className="text-base-content" />
              </div>
            )}

            <div
              className={cn(
                "chat-bubble text-sm shadow-xs",
                msg.role === "user"
                  ? "chat-bubble-primary"
                  : msg.debug?.isError
                    ? "bg-error/10 text-error border border-error/20"
                    : "bg-base-200 text-base-content border border-base-content/5",
              )}
            >
              {msg.content}
            </div>

            {/* Debug Info for Assistant messages */}
            {msg.role === "assistant" && msg.debug && (
              <div className="chat-footer opacity-90 mt-1.5 w-full max-w-[85%]">
                <div 
                  className={cn(
                    "p-2.5 rounded-lg text-xs border",
                    msg.debug.isError 
                      ? "bg-error/15 border-error/10 text-error" 
                      : "bg-success/15 border-success/10 text-success"
                  )}
                >
                  <div>Action: {msg.debug.action}</div>
                  {msg.debug.confidence && (
                    <div className="mb-0.5">
                      Confidence: {(msg.debug.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                  <div title={msg.debug.reasoning}>
                    Reason: {msg.debug.reasoning}
                  </div>
                  {(msg.debug.systemPrompt || msg.debug.userPrompt) && (
                    <button
                      type="button"
                      onClick={() => handleInspectPrompt(msg.debug!)}
                      className={cn(
                        "mt-2 hover:underline font-bold flex items-center gap-1 cursor-pointer w-fit",
                        msg.debug.isError ? "text-error" : "text-success"
                      )}
                    >
                      🔍 Inspect Prompt
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <Icon lucide={Bot} size={16} className="text-base-content" />
            </div>
            <div className="chat-bubble bg-base-200 text-base-content border border-base-content/5 flex items-center justify-center h-9 px-4">
              <span className="loading loading-dots loading-xs text-base-content/60"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pb-6 border-t border-base-content/5 bg-base-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập tin nhắn test giả lập..."
            className="input input-bordered flex-1 rounded-full text-sm bg-base-200/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="btn btn-circle btn-primary btn-md shrink-0"
          >
            <Icon lucide={Send} size={16} className="-ml-0.5 mt-0.5" />
          </button>
        </div>
      </div>

      {/* Modal Inspect Prompt */}
      <dialog ref={inspectDialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-4xl bg-base-100 border border-base-content/10 flex flex-col max-h-[80vh] p-6 rounded-2xl">
          <div className="flex justify-between items-center border-b border-base-content/5 pb-3">
            <h3 className="font-extrabold text-lg text-primary flex items-center gap-2">
              🔍 Inspect Prompt
            </h3>
            <button
              type="button"
              onClick={() => inspectDialogRef.current?.close()}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs: System Prompt vs User Prompt */}
          <div className="tabs tabs-boxed my-3 bg-base-200">
            <button
              type="button"
              onClick={() => setActiveInspectTab("system")}
              className={cn("tab tab-sm flex-1 font-bold", activeInspectTab === "system" && "tab-active bg-primary text-primary-content")}
            >
              System Prompt
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectTab("user")}
              className={cn("tab tab-sm flex-1 font-bold", activeInspectTab === "user" && "tab-active bg-primary text-primary-content")}
            >
              User Context & History
            </button>
          </div>

          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={handleCopyInspect}
              className="btn btn-xs btn-outline btn-neutral flex items-center gap-1 rounded-full"
            >
              {isInspectCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {isInspectCopied ? "Đã sao chép" : "Sao chép"}
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-base-300 rounded-xl p-4 border border-base-content/5">
            <pre className="font-mono text-xs whitespace-pre-wrap select-all leading-relaxed text-base-content">
              {activeInspectTab === "system"
                ? selectedDebugData?.systemPrompt || "Không có dữ liệu System Prompt."
                : selectedDebugData?.userPrompt || "Không có dữ liệu User Context."}
            </pre>
          </div>

          <div className="modal-action mt-4 pt-3 border-t border-base-content/5">
            <button
              type="button"
              onClick={() => inspectDialogRef.current?.close()}
              className="btn btn-sm btn-ghost rounded-full"
            >
              Đóng
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

