import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/infrastructure/supabase/middleware';

export default async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Webhook routes should bypass session updates and auth logic
  if (path.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // Meta OAuth routes must bypass middleware auth to avoid redirect loops
  // The callback route needs to read cookies set before Facebook redirected back
  if (path.startsWith('/api/auth/meta')) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Auth routes (only for guests)
  const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register');
  
  // Protected routes (only for authenticated users)
  const isProtectedRoute = 
    path === '/' ||
    path.startsWith('/dashboard') || 
    path.startsWith('/settings') || 
    path.startsWith('/inbox') || 
    path.startsWith('/workspaces');

  // Redirection logic
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isProtectedRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
