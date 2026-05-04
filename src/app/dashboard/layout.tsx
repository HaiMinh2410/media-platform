'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { MainHeader } from '@/components/layout/main-header';
import { Toaster } from 'sonner';
import { getCurrentUserWorkspaceAction } from '@/application/actions/workspace.actions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    getCurrentUserWorkspaceAction().then((res: any) => {
      if (res.data?.workspace?.id) {
        setWorkspaceId(res.data.workspace.id);
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-background-primary overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors />
      <CommandPalette />
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width,260px)] bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.03)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(168,85,247,0.03)_0%,transparent_50%)] flex flex-col h-screen transition-[margin-left] duration-300 ease-in-out">
        {workspaceId && <MainHeader workspaceId={workspaceId} />}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
