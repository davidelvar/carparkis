import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Only operators and admins can lookup customers
    if (!session?.user || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        name: user.name || '',
        phone: user.phone || '',
      },
    });
  } catch (error) {
    console.error('Customer lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}
