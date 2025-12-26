import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { 
  sendTestEmail, 
  sendTestBookingConfirmation,
  sendTestBookingReminder,
  sendTestCheckInConfirmation,
  isEmailConfigured 
} from '@/lib/email/client';

export type TestEmailType = 'basic' | 'booking-confirmation' | 'booking-reminder' | 'check-in';

// POST /api/admin/settings/test-email - Send a test email
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Email is not configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const locale = body.locale || 'is';
    const type: TestEmailType = body.type || 'basic';

    let success = false;

    // Send appropriate test email based on type
    switch (type) {
      case 'booking-confirmation':
        success = await sendTestBookingConfirmation(user.email!, user.name || 'Admin', locale);
        break;
      case 'booking-reminder':
        success = await sendTestBookingReminder(user.email!, user.name || 'Admin', locale);
        break;
      case 'check-in':
        success = await sendTestCheckInConfirmation(user.email!, user.name || 'Admin', locale);
        break;
      case 'basic':
      default:
        success = await sendTestEmail(user.email!, locale);
        break;
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
