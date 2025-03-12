import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/signup',
  '/_next',
  '/favicon.ico',
  '/assets',
];

export function middleware(request: NextRequest) {
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path) || request.nextUrl.pathname === '/'
  );

  // Get token from cookies (stored during login)
  const token = request.cookies.get('wealthsphere_access_token')?.value;
  
  // If the path is not public and no token is found, redirect to login
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    // Add the current path as a callback parameter after login
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Continue with the request
  return NextResponse.next();
}

// Run the middleware on all paths except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes (/api/*)
     * - Static files (files with extensions)
     */
    '/((?!api|_next/static|_next/image|images|public).*)',
  ],
};