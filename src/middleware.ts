import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const url = new URL(request.url)
  const path = url.pathname

  // Auth routes (only for guests)
  const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register')
  
  // Protected routes (only for authenticated users)
  // We include common dashboard and settings paths that will be built soon
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/settings') || 
    path.startsWith('/inbox') || 
    path.startsWith('/workspaces')

  // Redirection logic
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
