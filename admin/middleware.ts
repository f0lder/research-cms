import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/', '/schemas', '/webhooks', '/clients', '/logs', '/media', '/users'];
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // ── Unauthenticated: redirect to login ────────────────────────────────────
  if (!token) {
    if (PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // ── Authenticated: redirect away from login/register ──────────────────────
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.redirect(new URL('/schemas', request.url));
  }

  // Redirect bare / to /schemas when authenticated
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/schemas', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};