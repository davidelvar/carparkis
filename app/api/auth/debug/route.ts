import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Get session using auth()
    const session = await auth();
    
    // Get JWT token
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const token = await getToken({ 
      req: request as any,
      secret,
    });
    
    // Get cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('session') || 
      c.name.includes('csrf') ||
      c.name.includes('callback')
    );
    
    // Get headers
    const headersList = await headers();
    const relevantHeaders = {
      host: headersList.get('host'),
      origin: headersList.get('origin'),
      referer: headersList.get('referer'),
      'user-agent': headersList.get('user-agent')?.substring(0, 50) + '...',
    };

    return NextResponse.json({
      success: true,
      debug: {
        session: session ? {
          user: session.user,
          expires: session.expires,
        } : null,
        token: token ? {
          id: token.id,
          email: token.email,
          role: token.role,
          iat: token.iat,
          exp: token.exp,
        } : null,
        cookies: authCookies.map(c => ({
          name: c.name,
          value: c.value.substring(0, 20) + '...',
        })),
        headers: relevantHeaders,
        env: {
          hasAuthSecret: !!process.env.AUTH_SECRET,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          nextAuthUrl: process.env.NEXTAUTH_URL,
          nodeEnv: process.env.NODE_ENV,
        },
      },
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
