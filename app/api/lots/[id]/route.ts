import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET single lot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lot = await prisma.lot.findUnique({
      where: { id },
      include: {
        services: {
          include: { service: true },
        },
        pricing: {
          include: { vehicleType: true },
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'Lot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lot });
  } catch (error) {
    console.error('Error fetching lot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lot' },
      { status: 500 }
    );
  }
}

// PATCH update lot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const lot = await prisma.lot.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: lot });
  } catch (error) {
    console.error('Error updating lot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lot' },
      { status: 500 }
    );
  }
}

// DELETE lot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if lot has bookings
    const bookingsCount = await prisma.booking.count({
      where: { lotId: id },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete lot with existing bookings' },
        { status: 400 }
      );
    }

    await prisma.lot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lot' },
      { status: 500 }
    );
  }
}
