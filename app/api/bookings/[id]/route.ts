import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Try to find by ID or reference
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
      },
      include: {
        vehicle: { include: { vehicleType: true } },
        lot: true,
        addons: { include: { service: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, spotNumber, internalNotes } = body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(spotNumber !== undefined && { spotNumber }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(status === 'CHECKED_IN' && { actualDropOff: new Date() }),
        ...(status === 'CHECKED_OUT' && { actualPickUp: new Date() }),
      },
      include: {
        vehicle: { include: { vehicleType: true } },
        lot: true,
        addons: { include: { service: true } },
      },
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
