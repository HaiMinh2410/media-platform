"use client";

import { Icon } from "@shared/ui";
import { cn } from "@shared/lib";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatSimulatorProps {
  accountId: string;
  accountName: string;
  personaDraft: any;
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  debug?: {
    action?: string;
    reasoning?: string;
    confidence?: number;
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
        }),
      });

      if (!res.ok) {
        // Fallback for when T168 is not yet implemented or error
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
          content: `(Mock) Dạ vâng ạ, chào bạn! Mình là ${personaDraft.name || "Em"}. Đây là giá của sản phẩm ạ: 500k.`,
          debug: {
            action: "send_price",
            reasoning: "User asked for price, providing mock data.",
            confidence: 0.95,
          },
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setIsTyping(false);
      }, 1500);
      return; // Return here to prevent setIsTyping(false) running twice immediately
    }

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-base-100 relative">
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
                  : "bg-base-200 text-base-content border border-base-content/5",
              )}
            >
              {msg.content}
            </div>

            {/* Debug Info for Assistant messages */}
            {msg.role === "assistant" && msg.debug && (
              <div className="chat-footer opacity-90 mt-1.5">
                <div className="p-2.5 rounded-lg bg-success/15 border border-success/10 text-xs text-success">
                  <div>Action: {msg.debug.action}</div>
                  {msg.debug.confidence && (
                    <div className="mb-0.5">
                      Confidence: {(msg.debug.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                  <div title={msg.debug.reasoning}>
                    Reason: {msg.debug.reasoning}
                  </div>
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
    </div>
  );
}
