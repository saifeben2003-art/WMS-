import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes — no auth required
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/track/') ||
    pathname === '/api/seed' ||
    pathname === '/api/route' // health check
  ) {
    return NextResponse.next();
  }

  // All other /api/* routes require authentication
  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
