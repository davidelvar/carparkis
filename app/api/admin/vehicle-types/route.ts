import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleTypes = await prisma.vehicleType.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: vehicleTypes,
    });
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle types' },
      { status: 500 }
    );
  }
}
