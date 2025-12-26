import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET all pricing (lot pricing)
export async function GET() {
  try {
    const pricing = await prisma.lotPricing.findMany({
      include: {
        vehicleType: true,
        lot: true,
      },
      orderBy: [{ lotId: 'asc' }, { vehicleTypeId: 'asc' }],
    });

    return NextResponse.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

// POST create new pricing
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lotId, vehicleTypeId, pricePerDay, weeklyDiscount, monthlyDiscount, isActive = true } = body;

    // Get default lot if not provided
    let effectiveLotId = lotId;
    if (!effectiveLotId) {
      const defaultLot = await prisma.lot.findFirst({ where: { isActive: true } });
      if (!defaultLot) {
        return NextResponse.json(
          { success: false, error: 'No active lot found' },
          { status: 400 }
        );
      }
      effectiveLotId = defaultLot.id;
    }

    const pricing = await prisma.lotPricing.create({
      data: {
        lotId: effectiveLotId,
        vehicleTypeId,
        pricePerDay,
        weeklyDiscount,
        monthlyDiscount,
        isActive,
      },
      include: {
        vehicleType: true,
        lot: true,
      },
    });

    return NextResponse.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Error creating pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create pricing' },
      { status: 500 }
    );
  }
}
