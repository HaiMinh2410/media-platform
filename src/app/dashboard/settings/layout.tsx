import React from 'react';
import { SettingsTabs } from '@/components/settings/settings-tabs';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[1000px] mx-auto p-10 md:py-12">
      <header className="mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground-secondary bg-clip-text text-transparent m-0 mb-2">
            Settings & Integrations
          </h1>
          <p className="text-foreground-secondary text-lg">
            Cấu hình liên kết tài khoản mạng xã hội, quản lý không gian làm việc và các công cụ phát triển nâng cao.
          </p>
        </div>
      </header>

      {/* Shared Route Tabs */}
      <SettingsTabs />

      {children}
    </div>
  );
}
