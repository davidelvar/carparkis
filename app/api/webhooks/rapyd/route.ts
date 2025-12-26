import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyWebhookSignature } from '@/lib/rapyd/client';
import { sendBookingConfirmation } from '@/lib/email/client';
import type { RapydWebhookType } from '@/lib/rapyd/types';

// Rapyd sends webhooks to this endpoint
// Configure this URL in the Rapyd dashboard: https://your-domain.com/api/webhooks/rapyd

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('signature') || '';
    const salt = request.headers.get('salt') || '';
    const timestamp = request.headers.get('timestamp') || '';
    
    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.RAPYD_WEBHOOK_SECRET;
    if (webhookSecret) {
      const urlPath = '/api/webhooks/rapyd';
      const isValid = verifyWebhookSignature(
        'post',
        urlPath,
        salt,
        timestamp,
        body,
        signature
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.type as RapydWebhookType;
    const eventData = event.data;

    console.log(`Rapyd webhook received: ${eventType}`, { id: event.id });

    switch (eventType) {
      case 'PAYMENT_COMPLETED':
        await handlePaymentCompleted(eventData);
        break;
        
      case 'PAYMENT_FAILED':
        await handlePaymentFailed(eventData);
        break;
        
      case 'PAYMENT_EXPIRED':
      case 'PAYMENT_CANCELED':
        await handlePaymentCanceled(eventData);
        break;
        
      case 'REFUND_COMPLETED':
        await handleRefundCompleted(eventData);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(data: any) {
  const paymentId = data.id;
  const merchantRef = data.merchant_reference_id;
  const metadata = data.metadata || {};
  
  console.log('Payment completed:', { paymentId, merchantRef });

  // Find booking by reference with all relations needed for email
  const booking = await prisma.booking.findFirst({
    where: { reference: merchantRef },
    include: { 
      payment: true,
      user: true,
      vehicle: true,
      lot: true,
    },
  });

  if (!booking) {
    console.error('Booking not found for reference:', merchantRef);
    return;
  }

  // Update payment status
  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'COMPLETED',
        providerRef: paymentId,
        providerData: data,
        paidAt: new Date(),
      },
    });
  } else {
    // Create payment record if doesn't exist
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: Math.round(data.amount),
        currency: data.currency_code || 'ISK',
        status: 'COMPLETED',
        provider: 'rapyd',
        providerRef: paymentId,
        providerData: data,
        paidAt: new Date(),
      },
    });
  }

  // Update booking status to confirmed
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CONFIRMED' },
  });

  console.log('Booking confirmed:', booking.reference);

  // Send confirmation email in user's preferred language
  try {
    // Check if email notifications are enabled
    const sendConfirmationSetting = await prisma.setting.findUnique({
      where: { key: 'sendBookingConfirmation' },
    });
    
    const shouldSendEmail = sendConfirmationSetting?.value !== false;
    
    if (shouldSendEmail && booking.user.email) {
      // Use user's preferred locale (defaults to 'is')
      const userLocale = (booking.user.locale === 'en' ? 'en' : 'is') as 'is' | 'en';
      
      await sendBookingConfirmation({
        booking: booking as any, // Type assertion for email data
        locale: userLocale,
      });
      
      console.log(`Confirmation email sent to ${booking.user.email} in ${userLocale}`);
    }
  } catch (emailError) {
    // Log but don't fail the webhook for email errors
    console.error('Failed to send confirmation email:', emailError);
  }

  // TODO: Sync to accounting (Regla)
}

async function handlePaymentFailed(data: any) {
  const merchantRef = data.merchant_reference_id;
  const failureCode = data.failure_code;
  const failureMessage = data.failure_message;
  
  console.log('Payment failed:', { merchantRef, failureCode, failureMessage });

  const booking = await prisma.booking.findFirst({
    where: { reference: merchantRef },
    include: { payment: true },
  });

  if (!booking) {
    console.error('Booking not found for reference:', merchantRef);
    return;
  }

  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'FAILED',
        providerData: data,
      },
    });
  }

  // Keep booking in PENDING status - user can retry payment
}

async function handlePaymentCanceled(data: any) {
  const merchantRef = data.merchant_reference_id;
  
  console.log('Payment canceled/expired:', { merchantRef });

  const booking = await prisma.booking.findFirst({
    where: { reference: merchantRef },
    include: { payment: true },
  });

  if (!booking) {
    return;
  }

  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'FAILED',
        providerData: data,
      },
    });
  }
}

async function handleRefundCompleted(data: any) {
  const paymentId = data.payment;
  const refundAmount = data.amount;
  
  console.log('Refund completed:', { paymentId, refundAmount });

  // Find payment by provider ref
  const payment = await prisma.payment.findFirst({
    where: { providerRef: paymentId },
    include: { booking: true },
  });

  if (!payment) {
    console.error('Payment not found for refund:', paymentId);
    return;
  }

  // Update payment status
  const isFullRefund = refundAmount >= payment.amount;
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundAmount: refundAmount,
      refundedAt: new Date(),
    },
  });

  // Update booking status if fully refunded
  if (isFullRefund) {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CANCELLED' },
    });
  }
}
