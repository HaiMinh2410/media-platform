'use client';

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


  const [activeTab, setActiveTab] = useState<typeof tabItems[number]['value']>("basic");

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary rounded-full shadow-none"
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 flex-1 min-h-0">
        {/* Left Panel: Form */}
        <div className="card card-bordered bg-base-100 border-base-content/5 shadow-sm rounded-2xl flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="p-2 border-b border-base-content/5 overflow-x-auto scrollbar-hide">
            <SlidingTabs
              items={tabItems}
              activeValue={activeTab}
              onChange={setActiveTab}
              size="sm"
              rounded="rounded-full"
            />
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
            <PersonaFormTabs
              activeTab={activeTab}
              persona={persona}
              onChange={(updates: any) =>
                setPersona({ ...persona, ...updates })
              }
            />
          </div>
        </div>

        {/* Right Panel: Simulator */}
        <div className="card card-bordered bg-base-100 border-base-content/5 shadow-sm rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-base-content/5 bg-base-200/20 flex justify-between items-center">
            <h3 className="font-bold text-base flex items-center gap-2 text-base-content">
              <Icon lucide={Play} size={16} className="text-primary animate-pulse" />
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

