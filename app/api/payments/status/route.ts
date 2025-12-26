import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';
import { getPayment, isRapydConfigured } from '@/lib/rapyd/client';

// GET /api/payments/status?bookingId=xxx - Get payment status for a booking
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get the booking with payment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user owns this booking
    if (session?.user?.id && booking.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If no payment record exists
    if (!booking.payment) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'NOT_STARTED',
          bookingStatus: booking.status,
          amount: booking.totalPrice,
        },
      });
    }

    // If payment is completed
    if (booking.payment.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'COMPLETED',
          bookingStatus: booking.status,
          amount: booking.payment.amount,
          paidAt: booking.payment.paidAt,
        },
      });
    }

    // If payment is pending and we have Rapyd configured, check status with Rapyd
    if (booking.payment.status === 'PENDING' && booking.payment.providerRef && isRapydConfigured()) {
      try {
        const rapydPayment = await getPayment(booking.payment.providerRef);
        
        // Update local status if payment completed
        if (rapydPayment.paid) {
          await prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(rapydPayment.paid_at * 1000),
              providerData: rapydPayment as any,
            },
          });

          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'CONFIRMED' },
          });

          return NextResponse.json({
            success: true,
            data: {
              status: 'COMPLETED',
              bookingStatus: 'CONFIRMED',
              amount: booking.payment.amount,
              paidAt: new Date(rapydPayment.paid_at * 1000),
            },
          });
        }
      } catch (error) {
        console.error('Failed to check Rapyd payment status:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: booking.payment.status,
        bookingStatus: booking.status,
        amount: booking.payment.amount,
      },
    });
  } catch (error) {
    console.error('Failed to get payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
