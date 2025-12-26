import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeServices = searchParams.get('includeServices') === 'true';
    const includePricing = searchParams.get('includePricing') === 'true';
    const includeAll = searchParams.get('includeAll') === 'true';

    const lots = await prisma.lot.findMany({
      where: includeAll ? undefined : { isActive: true },
      include: {
        services: includeServices
          ? {
              where: { isAvailable: true },
              include: { service: true },
            }
          : false,
        pricing: includePricing
          ? {
              where: { isActive: true },
              include: { vehicleType: true },
            }
          : false,
      },
      orderBy: { name: 'asc' },
    });

    // Calculate actual available spaces based on active bookings
    const now = new Date();
    const lotsWithOccupancy = await Promise.all(
      lots.map(async (lot) => {
        // Count bookings that are currently active (vehicle is parked)
        const activeBookings = await prisma.booking.count({
          where: {
            lotId: lot.id,
            status: {
              in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'READY'],
            },
            dropOffTime: { lte: now },
            pickUpTime: { gte: now },
          },
        });

        return {
          ...lot,
          availableSpaces: Math.max(0, lot.totalSpaces - activeBookings),
        };
      })
    );

    return NextResponse.json({ success: true, data: lotsWithOccupancy });
  } catch (error) {
    console.error('Lots fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lots' },
      { status: 500 }
    );
  }
}

// POST create new lot
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
    const { name, nameEn, instructions, instructionsEn, totalSpaces, isActive = true } = body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const lot = await prisma.lot.create({
      data: {
        name,
        nameEn,
        slug,
        instructions,
        instructionsEn,
        totalSpaces,
        isActive,
      },
    });

    return NextResponse.json({ success: true, data: lot });
  } catch (error) {
    console.error('Lot create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lot' },
      { status: 500 }
    );
  }
}
