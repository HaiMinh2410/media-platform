"use client";

import { Icon, SlidingTabs } from "@shared/ui";

// Persona edit client component
import { useState } from "react";
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Play,
  User2,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PersonaFormTabs } from "./persona-form-tabs";
import { ChatSimulator } from "./chat-simulator";
import { toast } from "sonner";

interface PersonaEditClientProps {
  account: any;
  initialPersona: any;
}

export function PersonaEditClient({
  account,
  initialPersona,
}: PersonaEditClientProps) {
  const [persona, setPersona] = useState(initialPersona);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/ai-personas/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persona),
      });

      if (!res.ok) throw new Error("Failed to save persona");

      toast.success("Lưu cấu hình Persona thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi lưu Persona");
    } finally {
      setIsSaving(false);
    }
  };

  const tabItems = [
    { value: "basic", label: "Cơ bản", icon: User2 },
    { value: "campaign", label: "Chiến dịch (Sales)", icon: MessageCircle },
    { value: "advanced", label: "Prompt nâng cao", icon: Sparkles },
    { value: "safety", label: "An toàn & Tham số", icon: ShieldAlert },
  ] as const;

  const [activeTab, setActiveTab] =
    useState<(typeof tabItems)[number]["value"]>("basic");

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
          size="sm"
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
            />
          </div>

          {/* Form Footer Action Bar */}
          <div className="p-5 border-t border-base-content/5 bg-base-200/10 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-base-content/50">
              Hãy lưu lại cấu hình sau khi hoàn tất chỉnh sửa.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary px-6 rounded-full shadow-none font-bold min-w-[120px]"
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

        {/* Right Panel: Simulator */}
        <div className="card card-bordered bg-base-100 border-base-content/5 shadow-sm rounded-2xl flex flex-col overflow-hidden lg:sticky lg:top-6 lg:h-[calc(100vh-120px)]">
          <div className="p-4 border-b border-base-content/5 bg-base-200/20 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-base flex items-center gap-2 text-base-content">
              <Icon
                lucide={Play}
                size={16}
                className="text-primary animate-pulse"
              />
              Live Simulator
            </h3>
            <span className="badge badge-primary badge-soft font-bold text-2xs uppercase tracking-wider">
              Test Mode
            </span>
          </div>
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
  );
}
