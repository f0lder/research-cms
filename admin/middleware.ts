import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/', '/schemas', '/webhooks', '/clients', '/logs', '/media', '/users'];
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for data requests and static assets
  if (pathname.startsWith('/_next') || pathname.includes('/__') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;

  // ── No session: protect routes, allow public routes ────────────────────────
  if (!session) {
    // Allow /login and /register without session
    if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/login/') || pathname.startsWith('/register/')) {
      return NextResponse.next();
    }
    
    // Redirect everything else to login (/ and all protected routes)
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Session exists: allow protected routes, redirect public routes to / ────
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/login/') || pathname.startsWith('/register/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Authenticated user on any other route (/, /schemas, etc.) → allow it
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};