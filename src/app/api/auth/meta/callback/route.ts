import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMetaConnectionService } from '@/application/services/meta-connection.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const cookieStore = await cookies();
  const oauthStateCookie = cookieStore.get('meta_oauth_state');
  
  if (!oauthStateCookie) {
    return NextResponse.redirect(new URL('/dashboard/settings/accounts?error=EXPIRED_SESSION', request.url));
  }

  let storedData;
  try {
    storedData = JSON.parse(oauthStateCookie.value);
  } catch (e) {
    return NextResponse.redirect(new URL('/dashboard/settings/accounts?error=INVALID_SESSION', request.url));
  }

  const { state: storedState, workspaceId } = storedData;

  // 1. Check for Meta-side errors
  if (error) {
    console.error('[MetaCallback] Error from Meta:', error, errorDescription);
    return NextResponse.redirect(new URL(`/dashboard/settings/accounts?error=${error}`, request.url));
  }

  // 2. Validate state (CSRF protection)
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/dashboard/settings/accounts?error=STATE_MISMATCH', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings/accounts?error=MISSING_CODE', request.url));
  }

  // 4. Process the connection
  const metaService = getMetaConnectionService();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/meta/callback`;

  const result = await metaService.connectAccount(code, workspaceId, redirectUri);

  const finalUrl = result.error 
    ? `/dashboard/settings/accounts?error=${result.error}`
    : '/dashboard/settings/accounts?success=true';

  const response = NextResponse.redirect(new URL(finalUrl, request.url));

  // 5. Clear the state cookie
  response.cookies.delete('meta_oauth_state');

  return response;
}
