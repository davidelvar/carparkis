import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

// GET /api/account - Get user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            bookings: true,
            vehicles: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        bookingsCount: user._count.bookings,
        vehiclesCount: user._count.vehicles,
      },
    });
  } catch (error) {
    console.error('Failed to fetch account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PATCH /api/account - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            bookings: true,
            vehicles: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        bookingsCount: user._count.bookings,
        vehiclesCount: user._count.vehicles,
      },
    });
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/account - Delete user account (GDPR)
export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete user and all related data (cascading should be set up in Prisma)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
