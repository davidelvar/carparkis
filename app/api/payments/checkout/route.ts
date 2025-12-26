import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';
import { createCheckout as createRapydCheckout, isRapydConfigured } from '@/lib/rapyd/client';
import { createCheckout as createNetgiroCheckout, isNetgiroConfigured } from '@/lib/netgiro/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Get the active payment provider from settings
async function getPaymentProvider(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'paymentProvider' },
    });
    return (setting?.value as string) || 'rapyd';
  } catch {
    return 'rapyd';
  }
}

// POST /api/payments/checkout - Create a checkout session for a booking
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { bookingId, locale = 'en', provider: requestedProvider } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        vehicle: true,
        lot: true,
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user owns this booking or is admin
    if (session?.user?.id && booking.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if payment already exists and is completed
    if (booking.payment?.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment already completed' },
        { status: 400 }
      );
    }

    // Determine which payment provider to use
    const configuredProvider = await getPaymentProvider();
    const provider = requestedProvider || configuredProvider;

    // Handle payment based on provider
    if (provider === 'netgiro') {
      return handleNetgiroCheckout(booking, locale);
    } else {
      // Default to Rapyd
      return handleRapydCheckout(booking, locale);
    }
  } catch (error) {
    console.error('Failed to create checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment checkout' },
      { status: 500 }
    );
  }
}

// Handle Rapyd checkout
async function handleRapydCheckout(booking: any, locale: string) {
  // Check if Rapyd is configured
  if (!isRapydConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Rapyd payment gateway not configured' },
      { status: 500 }
    );
  }

  // Create or update payment record
  let payment = booking.payment;
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: 'ISK',
        status: 'PENDING',
        provider: 'rapyd',
      },
    });
  }

  // Create Rapyd checkout
  const checkout = await createRapydCheckout({
    amount: booking.totalPrice,
    currency: 'ISK',
    country: 'IS', // Iceland
    merchantReferenceId: booking.reference,
    description: locale === 'is' 
      ? `Bílastæðabókun ${booking.reference} - ${booking.vehicle.licensePlate}`
      : `Parking booking ${booking.reference} - ${booking.vehicle.licensePlate}`,
    completePaymentUrl: `${APP_URL}/${locale}/booking/confirmation?ref=${booking.reference}&status=success`,
    errorPaymentUrl: `${APP_URL}/${locale}/booking/confirmation?ref=${booking.reference}&status=failed`,
    cancelCheckoutUrl: `${APP_URL}/${locale}/booking?cancelled=true`,
    completeCheckoutUrl: `${APP_URL}/${locale}/booking/confirmation?ref=${booking.reference}`,
    language: locale === 'is' ? 'is' : 'en',
    metadata: {
      booking_id: booking.id,
      booking_reference: booking.reference,
      payment_id: payment.id,
      vehicle: booking.vehicle.licensePlate,
      locale,
    },
    customerEmail: booking.user?.email || undefined,
    customerName: booking.user?.name || undefined,
    expirationMinutes: 60, // 1 hour to complete payment
  });

  // Update payment with checkout ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerRef: checkout.id,
      providerData: checkout as any,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      provider: 'rapyd',
      checkoutId: checkout.id,
      redirectUrl: checkout.redirect_url,
      expiresAt: new Date(checkout.page_expiration * 1000).toISOString(),
    },
  });
}

// Handle Netgiro checkout
async function handleNetgiroCheckout(booking: any, locale: string) {
  // Check if Netgiro is configured
  if (!isNetgiroConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Netgíró payment gateway not configured' },
      { status: 500 }
    );
  }

  // Create or update payment record
  let payment = booking.payment;
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: 'ISK',
        status: 'PENDING',
        provider: 'netgiro',
      },
    });
  } else {
    // Update provider if switching
    await prisma.payment.update({
      where: { id: payment.id },
      data: { provider: 'netgiro' },
    });
  }

  // Create Netgiro checkout
  const checkout = await createNetgiroCheckout({
    amount: booking.totalPrice,
    referenceNumber: booking.reference,
    description: locale === 'is' 
      ? `Bílastæðabókun ${booking.reference} - ${booking.vehicle.licensePlate}`
      : `Parking booking ${booking.reference} - ${booking.vehicle.licensePlate}`,
    successUrl: `${APP_URL}/${locale}/booking/confirmation?ref=${booking.reference}&status=success`,
    cancelUrl: `${APP_URL}/${locale}/booking?cancelled=true`,
    confirmUrl: `${APP_URL}/api/webhooks/netgiro`,
    message: locale === 'is'
      ? `Bílastæðabókun hjá CarPark`
      : `Parking booking at CarPark`,
    items: [
      {
        name: locale === 'is' ? 'Bílastæði' : 'Parking',
        unitPrice: booking.totalPrice,
        quantity: 1,
        productNo: booking.reference,
      },
    ],
  });

  // Update payment with checkout info
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerData: {
        checkoutUrl: checkout.checkoutUrl,
        formData: checkout.formData,
      } as any,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      provider: 'netgiro',
      checkoutUrl: checkout.checkoutUrl,
      formData: checkout.formData,
      method: checkout.method,
    },
  });
}
