import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import { getPublisherAccountRepository } from '@/infrastructure/repositories/publisher-account.repository';
import { getTokenManagementService } from '@/application/services/token-management.service';

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const profileId = user.id;
    const accountRepo = getPublisherAccountRepository();
    const tokenService = getTokenManagementService();

    // 2. Fetch all accounts for this profile
    const accountsResult = await accountRepo.findByProfileId(profileId);
    if (accountsResult.error || !accountsResult.data) {
      return NextResponse.json({ error: accountsResult.error || 'FETCH_ACCOUNTS_FAILED' }, { status: 500 });
    }

    const accounts = accountsResult.data;
    const healthResults = [];

    // 3. Validate health for each account
    console.log(`>>> [HealthCheck] Validating health for ${accounts.length} accounts of user ${profileId}`);

    for (const account of accounts) {
      const health = await tokenService.validateTokenHealth(account.id);
      healthResults.push({
        id: account.id,
        platform: account.platform,
        name: account.name,
        isValid: health.is_valid,
        lastValidated: new Date(),
        error: health.error
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      accounts: healthResults
    });

  } catch (error: any) {
    console.error('[API:AccountsHealth] Global error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
