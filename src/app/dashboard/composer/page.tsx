import React from 'react';
import { createClient } from '@/infrastructure/supabase/server';
import { getAccountSyncService } from '@/application/services/account-sync.service';
import { getPublisherAccountRepository } from '@/infrastructure/repositories/publisher-account.repository';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { PostComposerRoot } from '@/components/post-composer/post-composer-root';
import { redirect } from 'next/navigation';
import { FeatureFlagService, FLAGS } from '@/application/services/feature-flag.service';

export default async function ComposerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Canary Rollout Check
  if (!FeatureFlagService.isEnabled(user.id, FLAGS.SOCIAL_PUBLISHER_PRO, 100)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-2">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Social Publisher Pro</h2>
        <p className="text-slate-400 font-medium leading-relaxed">
          Tính năng lên lịch và đăng bài đa nền tảng đang trong giai đoạn thử nghiệm (Canary Rollout).
          Chúng tôi đang triển khai dần cho người dùng và sẽ sớm mở rộng cho tài khoản của bạn!
        </p>
      </div>
    );
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">No workspace found. Please create one first.</p>
      </div>
    );
  }

  const publisherRepo = getPublisherAccountRepository();
  const platformRepo = getPlatformAccountRepository();
  const syncService = getAccountSyncService();

  // 1. Tự động đồng bộ tài khoản từ hệ thống cũ sang mới
  await syncService.syncLegacyAccounts(user.id, workspace.id);

  // 2. Lấy dữ liệu mới nhất sau khi đồng bộ
  const { data: publisherAccounts } = await publisherRepo.findByProfileId(user.id);
  const { data: platformAccounts } = await platformRepo.findByWorkspaceId(workspace.id);

  // Merge and normalize accounts, prioritizing publisher accounts
  const mergedAccounts = [...(publisherAccounts || [])];
  
  if (platformAccounts) {
    platformAccounts.forEach(oldAcc => {
      const platformUpper = oldAcc.platform.toUpperCase();
      const exists = mergedAccounts.some(
        newAcc => newAcc.platform.toUpperCase() === platformUpper && 
                 (newAcc as any).platform_id === oldAcc.externalId
      );
      if (!exists) {
        mergedAccounts.push({
          id: oldAcc.id,
          platform: platformUpper,
          platform_id: oldAcc.externalId,
          name: oldAcc.name,
          avatar_url: (oldAcc as any).avatar_url,
          is_legacy: true
        } as any);
      }
    });
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PostComposerRoot 
        accounts={mergedAccounts} 
        workspaceId={workspace.id} 
      />
    </div>
  );
}
