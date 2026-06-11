import { db } from "@shared/lib/db";

import { redirect } from 'next/navigation';
import { createClient } from '@shared/api/supabase/server';
import { getWorkspaceRepository } from '@features/settings/repositories/workspace.repository';
import { PersonaList } from '@features/settings/components/personas/persona-list';
import { AlertCircle } from "lucide-react";

export default async function PersonasSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace, error: wsError } = await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto shadow-sm">
        <AlertCircle size={20} className="shrink-0" />
        <span>No workspace found.</span>
      </div>
    );
  }

  // Fetch all accounts with their AI Persona and basic stats
  const accounts = await db.platformAccount.findMany({
    where: { 
      workspaceId: workspace.id,
      disconnected_at: null,
    },
    include: {
      ai_personas: true,
    },
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PersonaList accounts={accounts} />
    </div>
  );
}

