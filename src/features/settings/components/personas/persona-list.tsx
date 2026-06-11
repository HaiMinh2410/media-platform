'use client';

import { AccountAvatar, Icon } from "@shared/ui";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bot, User2, MessageCircle, ArrowRight } from "lucide-react";
import Image from "next/image";

type AccountWithPersona = {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_user_name: string;
  metadata?: any;
  ai_personas?: {
    name: string;
    campaign_name: string | null;
    updated_at: Date;
  } | null;
};

interface PersonaListProps {
  accounts: any[];
}

export function PersonaList({ accounts }: PersonaListProps) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-8 text-center bg-foreground/2 border border-foreground/10 rounded-2xl">
        <p className="text-foreground-secondary">
          Chưa có tài khoản nào được kết nối.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => {
        const persona = account.ai_personas;
        const meta = (account.metadata || {}) as any;
        const avatarUrl = meta?.avatar_url || meta?.profile_picture_url || meta?.picture?.data?.url || undefined;

        return (
          <Link
            key={account.id}
            href={`/dashboard/settings/personas/${account.id}`}
            className="group flex flex-col p-6 bg-foreground/2 hover:bg-foreground/4 border border-foreground/10 hover:border-foreground/20 rounded-4xl transition-all duration-200 no-underline relative overflow-hidden backdrop-blur-xl"
          >
            {/* Glassmorphism shine effect */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-60 transition-opacity duration-200 pointer-events-none" />

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <AccountAvatar
                  avatarUrl={avatarUrl}
                  name={account.platform_user_name}
                  platform={account.platform}
                  size="lg"
                  className="group-hover:scale-105 transition-transform duration-200"
                />
                <div>
                  <h3 className="font-semibold text-base text-foreground m-0 group-hover:text-primary transition-colors">
                    {account.platform_user_name}
                  </h3>
                  <p className="text-xs text-foreground-tertiary">
                    {account.platform === "instagram"
                      ? "Instagram"
                      : "Facebook Page"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon lucide={Bot} size={16} className="group-hover:text-primary" />
                  <span>Persona:</span>
                </div>
                <span className="font-medium text-foreground">
                  {persona?.name || "Mặc định (Em)"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon
                    lucide={MessageCircle}
                    size={16}
                    className="group-hover:text-primary"
                  />
                  <span>Chiến dịch:</span>
                </div>
                <span
                  className="font-medium text-foreground truncate max-w-[120px]"
                  title={persona?.campaign_name || "Chưa thiết lập"}
                >
                  {persona?.campaign_name || "Chưa thiết lập"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon lucide={User2} size={16} className="group-hover:text-primary " />
                  <span>Conversion:</span>
                </div>
                <span className="font-medium text-foreground">
                  {/* Mock Conversion Rate for MVP */}
                  {persona ? "12.5%" : "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between">
              <span className="text-sm font-thin text-foreground-tertiary">
                Cập nhật:{" "}
                {persona?.updated_at
                  ? formatDistanceToNow(new Date(persona.updated_at), {
                      addSuffix: true,
                      locale: vi,
                    })
                  : "Chưa có dữ liệu"}
              </span>
              <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-200 flex items-center gap-1">
                Cấu hình <Icon lucide={ArrowRight} size={14} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
