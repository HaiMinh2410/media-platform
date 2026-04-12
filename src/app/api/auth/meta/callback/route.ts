import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMetaConnectionService } from '@/application/services/meta-connection.service';
import { createClient } from '@/infrastructure/supabase/server';

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const cookieStore = await cookies();
  const oauthStateCookie = cookieStore.get('meta_oauth_state');
  
  if (!oauthStateCookie) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/accounts?error=EXPIRED_SESSION`);
  }

  let storedData;
  try {
    storedData = JSON.parse(oauthStateCookie.value);
  } catch (e) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/accounts?error=INVALID_SESSION`);
  }

  const { state: storedState, workspaceId } = storedData;

  // 1. Check for Meta-side errors
  if (error) {
    console.error('[MetaCallback] Error from Meta:', error, errorDescription);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/accounts?error=${error}`);
  }

  // 2. Validate state (CSRF protection)
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/accounts?error=STATE_MISMATCH`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/accounts?error=MISSING_CODE`);
  }

  // 3b. Get authenticated user for profile_id
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/accounts?error=UNAUTHORIZED`);
  }

  // 4. Process the connection
  const metaService = getMetaConnectionService();
  const redirectUri = `${baseUrl}/api/auth/meta/callback`;

  const result = await metaService.connectAccount(code, workspaceId, redirectUri, user.id);

  const finalUrl = result.error 
    ? `${baseUrl}/dashboard/settings/accounts?error=${result.error}`
    : `${baseUrl}/dashboard/settings/accounts?success=true`;

  const response = NextResponse.redirect(finalUrl);

  // 5. Clear the state cookie
  response.cookies.delete('meta_oauth_state');

  return response;
}
