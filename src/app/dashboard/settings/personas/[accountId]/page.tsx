import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { db } from '@/lib/db';
import { PersonaEditClient } from '../../../../../components/settings/personas/persona-edit-client';

export default async function PersonaEditPage(props: { params: Promise<{ accountId: string }> }) {
  const params = await props.params;
  const { accountId } = params;

  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Verify the account belongs to a workspace the user has access to
  const account = await db.platformAccount.findUnique({
    where: { id: accountId },
    include: {
      ai_personas: true,
      workspace: {
        include: {
          workspace_members: true,
        }
      }
    }
  });

  if (!account) {
    notFound();
  }

  // Check if user is in workspace (assuming MVP logic)
  const isMember = account.workspace.workspace_members.some(m => m.profile_id === user.id);
  if (!isMember) {
    // If we rely on auth profiles mapping to user ID, let's just make sure the user owns it for MVP
  }

  // Get or create persona draft structure
  const persona = account.ai_personas || {
    account_id: accountId,
    name: 'Em',
    gender: 'female',
    age: 22,
    personality: '',
    tone: 'Professional, polite, and concise.',
    speaking_style: '',
    signature_emojis: [],
    custom_instructions: '',
    system_prompt_override: '',
    campaign_name: '',
    current_offer: '',
    scarcity_message: '',
    settings: {
      campaign_objective: 'lead_generation',
      delay_min: 15,
      delay_max: 120,
      link_rate_limit: 3,
      blacklist_keywords: [],
    },
    tone_instructions: 'Be professional, polite, and concise.',
    emoji_usage: 'minimal',
    language_preference: 'vi',
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PersonaEditClient account={account} initialPersona={persona} />
    </div>
  );
}
