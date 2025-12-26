import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { 
  verifyResponseSignature, 
  NetgiroPaymentStatus,
  type NetgiroCallbackData,
} from '@/lib/netgiro/client';
import { sendBookingConfirmation } from '@/lib/email/client';

/**
 * Netgiro webhook endpoint
 * Handles callbacks from Netgiro when customer confirms/cancels payment
 * Configure CallbackUrl in the checkout request to point here
 */
export async function POST(request: NextRequest) {
  try {
    // Netgiro sends form-urlencoded data
    const contentType = request.headers.get('content-type') || '';
    let data: NetgiroCallbackData;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // Handle form-urlencoded
      const formData = await request.formData();
      data = {
        TransactionId: formData.get('TransactionId') as string,
        ReferenceNumber: formData.get('ReferenceNumber') as string,
        InvoiceNumber: parseInt(formData.get('InvoiceNumber') as string) || 0,
        TotalAmount: parseInt(formData.get('TotalAmount') as string) || 0,
        Status: parseInt(formData.get('Status') as string) as NetgiroPaymentStatus,
        NetgiroSignature: formData.get('NetgiroSignature') as string,
      };
    }

    console.log(`Netgiro webhook received:`, {
      reference: data.ReferenceNumber,
      status: data.Status,
      transactionId: data.TransactionId,
    });

    // Verify signature
    if (!verifyResponseSignature(data)) {
      console.error('Invalid Netgiro signature for reference:', data.ReferenceNumber);
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle based on status
    switch (data.Status) {
      case NetgiroPaymentStatus.Confirmed:
        await handlePaymentConfirmed(data);
        break;

      case NetgiroPaymentStatus.Canceled:
        await handlePaymentCanceled(data);
        break;

      case NetgiroPaymentStatus.Unconfirmed:
        // Payment pending - wait for confirmation
        console.log('Payment pending confirmation:', data.ReferenceNumber);
        break;

      default:
        console.log(`Unknown status ${data.Status} for reference:`, data.ReferenceNumber);
    }

    // Netgiro expects HTTP 200 OK to acknowledge the callback
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Netgiro webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Netgiro redirect response (GET request when customer returns)
 * This is called when customer completes payment and is redirected back
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse redirect parameters
    const data: NetgiroCallbackData = {
      TransactionId: searchParams.get('TransactionId') || searchParams.get('ng_TransactionId') || '',
      ReferenceNumber: searchParams.get('ReferenceNumber') || searchParams.get('ng_ReferenceNumber') || '',
      InvoiceNumber: parseInt(searchParams.get('InvoiceNumber') || searchParams.get('ng_InvoiceNumber') || '0'),
      TotalAmount: parseInt(searchParams.get('TotalAmount') || searchParams.get('ng_TotalAmount') || '0'),
      Status: parseInt(searchParams.get('Status') || searchParams.get('ng_Status') || '0') as NetgiroPaymentStatus,
      NetgiroSignature: searchParams.get('NetgiroSignature') || searchParams.get('ng_NetgiroSignature') || '',
    };

    // Verify signature if present
    if (data.NetgiroSignature && !verifyResponseSignature(data)) {
      console.error('Invalid Netgiro redirect signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Return status info (the actual handling is done via PaymentSuccessfulURL redirect)
    return NextResponse.json({
      success: true,
      data: {
        reference: data.ReferenceNumber,
        transactionId: data.TransactionId,
        invoiceNumber: data.InvoiceNumber,
        status: data.Status,
        statusText: getStatusText(data.Status),
      },
    });
  } catch (error) {
    console.error('Netgiro redirect processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}

function getStatusText(status: NetgiroPaymentStatus): string {
  switch (status) {
    case NetgiroPaymentStatus.Confirmed:
      return 'confirmed';
    case NetgiroPaymentStatus.Canceled:
      return 'canceled';
    case NetgiroPaymentStatus.Unconfirmed:
      return 'pending';
    default:
      return 'unknown';
  }
}

async function handlePaymentConfirmed(data: NetgiroCallbackData) {
  const { ReferenceNumber, TransactionId, InvoiceNumber, TotalAmount } = data;

  console.log('Netgiro payment confirmed:', { ReferenceNumber, TransactionId, InvoiceNumber });

  // Find booking by reference with all relations needed for email
  const booking = await prisma.booking.findFirst({
    where: { reference: ReferenceNumber },
    include: {
      payment: true,
      user: true,
      vehicle: true,
      lot: true,
    },
  });

  if (!booking) {
    console.error('Booking not found for reference:', ReferenceNumber);
    return;
  }

  // Update payment status
  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'COMPLETED',
        providerRef: TransactionId,
        providerData: {
          transactionId: TransactionId,
          invoiceNumber: InvoiceNumber,
          amount: TotalAmount,
          provider: 'netgiro',
        },
        paidAt: new Date(),
      },
    });
  } else {
    // Create payment record if doesn't exist
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: TotalAmount,
        currency: 'ISK',
        status: 'COMPLETED',
        provider: 'netgiro',
        providerRef: TransactionId,
        providerData: {
          transactionId: TransactionId,
          invoiceNumber: InvoiceNumber,
          amount: TotalAmount,
          provider: 'netgiro',
        },
        paidAt: new Date(),
      },
    });
  }

  // Update booking status to confirmed
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CONFIRMED' },
  });

  console.log('Booking confirmed via Netgiro:', booking.reference);

  // Send confirmation email
  try {
    const sendConfirmationSetting = await prisma.setting.findUnique({
      where: { key: 'sendBookingConfirmation' },
    });

    const shouldSendEmail = sendConfirmationSetting?.value !== false;

    if (shouldSendEmail && booking.user?.email) {
      const userLocale = (booking.user.locale === 'en' ? 'en' : 'is') as 'is' | 'en';

      await sendBookingConfirmation({
        booking: booking as any,
        locale: userLocale,
      });

      console.log(`Confirmation email sent to ${booking.user.email} in ${userLocale}`);
    }
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }
}

async function handlePaymentCanceled(data: NetgiroCallbackData) {
  const { ReferenceNumber, TransactionId } = data;

  console.log('Netgiro payment canceled:', { ReferenceNumber, TransactionId });

  const booking = await prisma.booking.findFirst({
    where: { reference: ReferenceNumber },
    include: { payment: true },
  });

  if (!booking) {
    console.error('Booking not found for reference:', ReferenceNumber);
    return;
  }

  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: 'FAILED', // Mark as failed since user canceled
        providerData: {
          transactionId: TransactionId,
          canceledAt: new Date().toISOString(),
          provider: 'netgiro',
          cancelReason: 'User canceled payment',
        },
      },
    });
  }

  // Keep booking in PENDING status - user can retry payment
  console.log('Payment canceled, booking remains pending:', ReferenceNumber);
}
