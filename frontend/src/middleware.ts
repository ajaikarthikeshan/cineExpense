import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOGIN_URL = '/auth/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = new URL(LOGIN_URL, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all /dashboard/* and /admin/* routes.
   * Public routes (/auth/login, /, static assets) are intentionally excluded.
   */
  matcher: ['/dashboard/:path*', '/admin/:path*', '/expenses/:path*', '/notifications/:path*', '/reports/:path*'],
};
