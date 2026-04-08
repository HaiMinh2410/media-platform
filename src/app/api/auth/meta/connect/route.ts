import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'MISSING_WORKSPACE_ID' }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/meta/callback`;
  
  // Scopes required for Meta management (Page + IG + Messaging)
  const scopes = [
    'public_profile',
    'email',
    'pages_show_list',
    'pages_read_engagement',
    'pages_messaging',
    'instagram_basic',
    'instagram_manage_messages'
  ].join(',');

  const state = crypto.randomUUID();

  const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`;

  const response = NextResponse.redirect(oauthUrl);

  // Store state and workspaceId in a secure cookie
  response.cookies.set('meta_oauth_state', JSON.stringify({ state, workspaceId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 hour
    path: '/',
  });

  return response;
}
