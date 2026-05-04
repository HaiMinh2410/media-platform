import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { BotConfigClient } from './bot-config-client';
import Link from 'next/link';

export default async function BotConfigPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const accountId = params.id;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const accountRepo = getPlatformAccountRepository();
  const { data: account, error } = await accountRepo.findById(accountId);

  if (error || !account) {
    return (
      <div className="max-w-[800px] mx-auto p-6">
        <div className="text-rose-500 p-4 bg-rose-500/10 rounded-lg">Account not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <header className="mb-8">
        <div className="flex flex-col gap-2">
          <Link href="/dashboard/settings/accounts" className="text-white/50 text-sm no-underline mb-2 inline-block transition-colors hover:text-white/80">
            &larr; Back to Accounts
          </Link>
          <h1 className="m-0 text-2xl font-bold text-white">Bot Configuration</h1>
          <p className="m-0 text-sm text-white/60">
            Manage AI automation for <strong className="text-white">{account.name}</strong> ({account.platform})
          </p>
        </div>
      </header>

      <div className="mt-6">
        <BotConfigClient accountId={accountId} />
      </div>
    </div>
  );
}
