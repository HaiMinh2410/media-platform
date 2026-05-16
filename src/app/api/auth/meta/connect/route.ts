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
  
  // Scopes:
  // NOTE: 'instagram_manage_messages' and 'instagram_manage_insights' require
  // Meta App Review before they work for users outside the dev team.
  // Keeping only basic scopes that work in development.
  const scopes = [
    'public_profile',
    'pages_show_list',
    'pages_read_engagement',
    'pages_messaging',
    'pages_manage_posts',
    'read_insights',
    'publish_video',
    'instagram_basic',
    'instagram_manage_messages',
    'instagram_manage_insights',
    'instagram_business_basic',
    'instagram_business_content_publish',
    'instagram_content_publish',
    'facebook_creator_marketplace_discovery',
    'instagram_creator_marketplace_discovery',
    'threads_basic',
    'threads_content_publish',
  ].join(',');

  const state = crypto.randomUUID();

  const oauthUrl = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`;

  const response = NextResponse.redirect(oauthUrl);

  // Store state and workspaceId in a secure cookie
  // sameSite: 'none' is required for cross-domain redirect (Facebook → ngrok/app)
  // lax would block the cookie on the redirect back from facebook.com
  const isHttps = redirectUri.startsWith('https');
  response.cookies.set('meta_oauth_state', JSON.stringify({ state, workspaceId }), {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 3600, // 1 hour
    path: '/',
  });

  return response;
}
