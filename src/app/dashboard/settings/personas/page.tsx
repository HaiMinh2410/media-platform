import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { db } from '@/lib/db';
import { PersonaList } from '@/components/settings/personas/persona-list';

export default async function PersonasSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace, error: wsError } = await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    return (
      <div className="p-8 text-center bg-error/5 border border-error/10 rounded-2xl">
        <p className="text-foreground-secondary">No workspace found.</p>
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
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-semibold m-0 mb-1">AI Personas</h2>
          <p className="text-foreground-secondary text-sm">
            Quản lý tính cách, tông giọng và chiến dịch chốt sale cho từng tài khoản mạng xã hội.
          </p>
        </div>
      </div>

      <PersonaList accounts={accounts} />
    </div>
  );
}
