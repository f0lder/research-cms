import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Validates the session against the API rather than trusting cookie presence,
// so an expired/invalidated/forged session is rejected at the edge.
async function isSessionValid(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `session=${sessionId}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for data requests and static assets
  if (pathname.startsWith('/_next') || pathname.includes('/__') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/login/') || pathname.startsWith('/register/');
  const session = request.cookies.get('session')?.value;
  const valid = session ? await isSessionValid(session) : false;

  // ── No valid session: protect routes, allow public routes ──────────────────
  if (!valid) {
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect everything else to login (/ and all protected routes)
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (session) {
      // Stale/expired/forged cookie — clear it so the client doesn't keep sending it
      response.cookies.delete('session');
    }
    return response;
  }

  // ── Valid session: allow protected routes, redirect public routes to / ─────
  if (isPublicRoute) {
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