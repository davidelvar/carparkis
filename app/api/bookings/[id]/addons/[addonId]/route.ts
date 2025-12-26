import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  const { id: bookingId, addonId } = await params;

  try {
    const body = await request.json();
    const { status, notes } = body;

    // Verify the addon belongs to the booking
    const addon = await prisma.bookingAddon.findFirst({
      where: {
        id: addonId,
        bookingId,
      },
    });

    if (!addon) {
      return NextResponse.json(
        { success: false, error: 'Addon not found' },
        { status: 404 }
      );
    }

    const updatedAddon = await prisma.bookingAddon.update({
      where: { id: addonId },
      data: {
        ...(status && { status }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        service: true,
      },
    });

    // Check if all addons are completed/skipped, if so update booking to READY
    if (status === 'COMPLETED' || status === 'SKIPPED') {
      const bookingAddons = await prisma.bookingAddon.findMany({
        where: { bookingId },
      });

      const allDone = bookingAddons.every(
        (a) => a.status === 'COMPLETED' || a.status === 'SKIPPED'
      );

      if (allDone) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });

        // Only auto-update to READY if currently IN_PROGRESS
        if (booking?.status === 'IN_PROGRESS') {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'READY' },
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedAddon });
  } catch (error) {
    console.error('Addon update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update addon' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  const { id: bookingId, addonId } = await params;

  try {
    const addon = await prisma.bookingAddon.findFirst({
      where: {
        id: addonId,
        bookingId,
      },
      include: {
        service: true,
      },
    });

    if (!addon) {
      return NextResponse.json(
        { success: false, error: 'Addon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: addon });
  } catch (error) {
    console.error('Addon fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch addon' },
      { status: 500 }
    );
  }
}
