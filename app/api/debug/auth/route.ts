import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  // List all cookies
  const cookies = request.cookies.getAll();
  const cookieNames = cookies.map(c => c.name);
  
  // Try to get token with different configurations
  let tokenDefault = null;
  let tokenSecure = null;
  let tokenNonSecure = null;
  
  try {
    tokenDefault = await getToken({ req: request, secret });
  } catch (e) {
    tokenDefault = { error: String(e) };
  }
  
  try {
    tokenSecure = await getToken({ 
      req: request, 
      secret,
      cookieName: '__Secure-authjs.session-token',
    });
  } catch (e) {
    tokenSecure = { error: String(e) };
  }
  
  try {
    tokenNonSecure = await getToken({ 
      req: request, 
      secret,
      cookieName: 'authjs.session-token',
    });
  } catch (e) {
    tokenNonSecure = { error: String(e) };
  }
  
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    cookieNames,
    tokenDefault: tokenDefault ? 'found' : 'null',
    tokenSecure: tokenSecure ? 'found' : 'null', 
    tokenNonSecure: tokenNonSecure ? 'found' : 'null',
    // Include role if token found
    role: tokenDefault?.role || tokenSecure?.role || tokenNonSecure?.role || null,
  });
}
