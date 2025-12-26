import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';
import { refundPayment, isRapydConfigured } from '@/lib/rapyd/client';

// POST /api/payments/refund - Refund a payment (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check admin role
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, amount, reason } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Can only refund completed payments' },
        { status: 400 }
      );
    }

    if (!payment.providerRef) {
      return NextResponse.json(
        { success: false, error: 'No payment provider reference found' },
        { status: 400 }
      );
    }

    if (!isRapydConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Process refund through Rapyd
    const refundAmount = amount || payment.amount;
    const refund = await refundPayment(payment.providerRef, refundAmount, reason);

    // Update payment record
    const isFullRefund = refundAmount >= payment.amount;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundAmount: refundAmount,
        refundedAt: new Date(),
        providerData: {
          ...(payment.providerData as object || {}),
          refund,
        },
      },
    });

    // Update booking status if fully refunded
    if (isFullRefund) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Failed to process refund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
