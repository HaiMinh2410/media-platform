import { redirect } from 'next/navigation';
import { createClient } from '@shared/api/supabase/server';
import { AiPipelineDetail } from '@features/settings/components/ai-pipeline-detail';

export default async function AiPipelineSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex flex-col gap-8">
      <AiPipelineDetail />
    </div>
  );
}
