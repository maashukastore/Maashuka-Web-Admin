import { NextResponse } from 'next/server'

// Protect /admin routes by checking a simple cookie "role".
// This is a development stub — replace with your real auth.

export function middleware(request) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/admin')) return

  // Allow login page publicly
  if (pathname === '/admin/login') return

  const cookie = request.cookies.get('role')
  if (!cookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Optionally: allow if supabase session cookie exists (sbp or sb-session)
  // Keep existing role cookie logic for now.

  return
}

export const config = {
  matcher: ['/admin/:path*'],
}
