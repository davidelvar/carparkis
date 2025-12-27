import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always include locale in URL to avoid redirect issues
});

// Protected route patterns
const protectedPatterns = [
  /^\/[a-z]{2}\/(customer|operator|admin)/,
  /^\/(customer|operator|admin)/,
];

const adminPatterns = [
  /^\/[a-z]{2}\/admin/,
  /^\/admin/,
];

const operatorPatterns = [
  /^\/[a-z]{2}\/operator/,
  /^\/operator/,
];

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = protectedPatterns.some((pattern) => pattern.test(pathname));
  const isAdminRoute = adminPatterns.some((pattern) => pattern.test(pathname));
  const isOperatorRoute = operatorPatterns.some((pattern) => pattern.test(pathname));

  if (isProtected) {
    // Use JWT token check instead of session (Edge compatible)
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    
    // getToken auto-detects the cookie name based on secure context
    // It looks for __Secure-authjs.session-token (HTTPS) or authjs.session-token (HTTP)
    const token = await getToken({ 
      req: request,
      secret,
      // Use the same salt as NextAuth v5
      salt: process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
    });

    if (!token) {
      // Redirect to login with callback URL
      const locale = pathname.match(/^\/([a-z]{2})\//)?.[1] || defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as string | undefined;

    // Check admin access
    if (isAdminRoute && userRole !== 'ADMIN') {
      const locale = pathname.match(/^\/([a-z]{2})\//)?.[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Check operator access (operators and admins can access)
    if (isOperatorRoute && !['OPERATOR', 'ADMIN'].includes(userRole || '')) {
      const locale = pathname.match(/^\/([a-z]{2})\//)?.[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // Apply i18n middleware and add pathname header
  const response = intlMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
