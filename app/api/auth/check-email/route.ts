import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      success: true,
      exists: !!user,
      // Don't expose the name for privacy
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
