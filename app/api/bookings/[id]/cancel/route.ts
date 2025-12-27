import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendBookingCancellation } from '@/lib/email/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { locale = 'is' } = await request.json().catch(() => ({}));

    // Get booking with relations
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
      },
      include: {
        vehicle: true,
        lot: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled
    if (['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'].includes(booking.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: locale === 'is' 
            ? 'Ekki er hægt að afturkalla þessa bókun' 
            : 'This booking cannot be cancelled' 
        },
        { status: 400 }
      );
    }

    // Check if booking is in the past
    if (new Date(booking.dropOffTime) < new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          error: locale === 'is' 
            ? 'Ekki er hægt að afturkalla bókun sem er hafin' 
            : 'Cannot cancel a booking that has already started' 
        },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    // Send cancellation email if user has email
    if (booking.user?.email) {
      await sendBookingCancellation({
        booking: booking as Parameters<typeof sendBookingCancellation>[0]['booking'],
        locale: locale as 'is' | 'en',
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: locale === 'is' ? 'Bókun afturkölluð' : 'Booking cancelled' 
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
