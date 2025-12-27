import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendBookingConfirmation } from '@/lib/email/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { locale = 'is' } = await request.json().catch(() => ({}));

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

    if (!booking.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No email address for this booking' },
        { status: 400 }
      );
    }

    const sent = await sendBookingConfirmation({
      booking: booking as Parameters<typeof sendBookingConfirmation>[0]['booking'],
      locale: locale as 'is' | 'en',
    });

    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Check SMTP configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: locale === 'is' ? 'Staðfestingarpóstur sendur' : 'Confirmation email sent' 
    });
  } catch (error) {
    console.error('Send confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}
