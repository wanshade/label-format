import { NextResponse, NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/signup', '/api/auth', '/_next', '/favicon.ico'];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // If the path is public, allow access without checks
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, let NextAuth handle the authentication
  // The protected layout will handle redirects
  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};