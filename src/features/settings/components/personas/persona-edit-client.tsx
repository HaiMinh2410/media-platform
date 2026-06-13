"use client";

import { Icon, SlidingTabs } from "@shared/ui";
import { cn } from "@shared/lib";

// Persona edit client component
import { useState } from "react";
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  UserCog,
  BriefcaseBusiness,
  Settings,
  Pen,
  Loader2,
} from "lucide-react";
import { PersonaFormTabs } from "./persona-form-tabs";
import { ChatSimulator } from "./chat-simulator";
import { toast } from "sonner";

interface PersonaEditClientProps {
  account: any;
  initialPersona: any;
  initialTab?: string;
}

export function PersonaEditClient({
  account,
  initialPersona,
  initialTab,
}: PersonaEditClientProps) {
  const [persona, setPersona] = useState(initialPersona);
  const [isSaving, setIsSaving] = useState(false);
  const [botConfig, setBotConfig] = useState<any | null>(null);
  const [isLoadingBot, setIsLoadingBot] = useState(true);
  const [isSticky, setIsSticky] = useState(false);
  const footerRef = React.useRef<HTMLDivElement>(null);

  // Live clock for phone status bar
  const [clockTime, setClockTime] = useState(() =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  React.useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }));
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(entry.intersectionRatio < 1);
      },
      {
        threshold: [1],
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    async function fetchBotConfig() {
      try {
        const res = await fetch(`/api/accounts/${account.id}/bot`);
        if (!res.ok) throw new Error("Failed to fetch bot config");
        const json = await res.json();
        setBotConfig({
          ...json.data,
          auto_reply_priorities: json.data.auto_reply_priorities || [],
          auto_reply_sentiments: json.data.auto_reply_sentiments || [],
        });
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải cấu hình Bot AI");
      } finally {
        setIsLoadingBot(false);
      }
    }
    fetchBotConfig();
  }, [account.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const personaPromise = fetch(`/api/ai-personas/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persona),
      });

      const botPromise = botConfig
        ? fetch(`/api/accounts/${account.id}/bot`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(botConfig),
          })
        : Promise.resolve(null);

      const [resPersona, resBot] = await Promise.all([
        personaPromise,
        botPromise,
      ]);

      if (!resPersona.ok) throw new Error("Failed to save persona");
      if (resBot && !resBot.ok) throw new Error("Failed to save bot config");

      toast.success("Lưu cấu hình Persona & Bot AI thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const tabItems = [
    { value: "safety", label: "Thiết lập", icon: Settings },
    { value: "basic", label: "Cơ bản", icon: UserCog },
    { value: "campaign", label: "Chiến dịch", icon: BriefcaseBusiness },
    { value: "advanced", label: "Nâng cao", icon: Pen },
  ] as const;

  const [activeTab, setActiveTab] = useState<
    (typeof tabItems)[number]["value"]
  >(
    initialTab && tabItems.some((t) => t.value === initialTab)
      ? (initialTab as (typeof tabItems)[number]["value"])
      : "basic",
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-base-content/5 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings/personas"
            className="btn btn-circle btn-ghost btn-sm"
          >
            <Icon lucide={ArrowLeft} size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-base-content m-0 flex items-center gap-2">
              Cấu hình Persona: {account.platform_user_name}
            </h2>
          </div>
        </div>

        {/* Tabs ở cùng hàng với Header, căn phải */}
        <SlidingTabs
          items={tabItems}
          activeValue={activeTab}
          onChange={setActiveTab}
          rounded="rounded-full"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Left Panel: Form */}
        <div className="card card-border bg-base-100 border-base-content/5 rounded-2xl flex flex-col">
          {/* Form Content */}
          <div className="p-6">
            <PersonaFormTabs
              activeTab={activeTab}
              persona={persona}
              account={account}
              onChange={(updates: any) =>
                setPersona({ ...persona, ...updates })
              }
              botConfig={botConfig}
              onChangeBotConfig={(updates: any) =>
                setBotConfig((prev: any) =>
                  prev ? { ...prev, ...updates } : null,
                )
              }
              isLoadingBot={isLoadingBot}
            />
          </div>

          {/* Form Footer Action Bar */}
          <div
            ref={footerRef}
            className={cn(
              "sticky -bottom-px z-10 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              isSticky
                ? "pb-3 pt-2 px-5 bg-base-100/90 backdrop-blur-md "
                : "p-5 border-t border-base-content/10 ",
            )}
          >
            <p className="text-xs text-base-content/70 font-medium">
              Hãy lưu lại cấu hình sau khi hoàn tất chỉnh sửa.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary rounded-full min-w-32 h-11 flex items-center gap-2"
            >
              {isSaving ? (
                <Icon lucide={Loader2} className="animate-spin" size={18} />
              ) : (
                <Icon lucide={Save} size={18} />
              )}
              Lưu
            </button>
          </div>
        </div>

        {/* Right Panel: Simulator (Phone Mockup) */}
        <div className="flex items-start justify-center px-5 lg:sticky lg:top-6">
          <div className="mockup-phone max-h-[90vh] border-base-content/10">
            <div className="mockup-phone-camera"></div>
            <div className="mockup-phone-display bg-base-100 flex flex-col">
              {/* Phone Status Bar */}
              <div className="pt-4 mb-2 grid grid-cols-3 shrink-0 text-base-content">
                <span className="flex items-center justify-center pl-4 text-sm font-semibold">{clockTime}</span>
                <div></div>
                <div className="flex items-center justify-center pr-4 gap-1">
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className="opacity-80"><rect x="0" y="5" width="3" height="7" rx="0.5"/><rect x="4.5" y="3.5" width="3" height="8.5" rx="0.5"/><rect x="9" y="1.5" width="3" height="10.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3"/></svg>
                  <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" className="opacity-80"><path d="M7.5 3.6c1.8 0 3.4.7 4.6 1.9l1.1-1.1C11.6 2.8 9.6 2 7.5 2S3.4 2.8 1.8 4.4l1.1 1.1C4.1 4.3 5.7 3.6 7.5 3.6zm0 3c1 0 2 .4 2.7 1.1l1.1-1.1c-1-1-2.4-1.6-3.8-1.6s-2.8.6-3.8 1.6l1.1 1.1c.7-.7 1.7-1.1 2.7-1.1zm0 3c.5 0 1 .2 1.4.6L7.5 12l-1.4-1.8c.4-.4.9-.6 1.4-.6z"/></svg>
                  <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor" className="opacity-80"><rect x="0" y="1" width="21" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="22" y="3.5" width="2" height="5" rx="0.5" opacity="0.4"/><rect x="1.5" y="2.5" width="14" height="7" rx="1"/></svg>
                </div>
              </div>
              {/* Phone Chat Content */}
              <div className="flex-1 min-h-0">
                <ChatSimulator
                  accountId={account.id}
                  personaDraft={persona}
                  accountName={account.platform_user_name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
