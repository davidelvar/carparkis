import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const url = new URL(request.url);
    const include = url.searchParams.get('include')?.split(',') || [];

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        kennitala: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { bookings: true },
        },
        ...(include.includes('bookings') && {
          bookings: {
            select: {
              id: true,
              reference: true,
              status: true,
              dropOffTime: true,
              pickUpTime: true,
              totalPrice: true,
              totalDays: true,
              departureFlightNumber: true,
              arrivalFlightNumber: true,
              createdAt: true,
              vehicle: {
                select: {
                  id: true,
                  licensePlate: true,
                  make: true,
                  model: true,
                  color: true,
                  vehicleType: {
                    select: {
                      name: true,
                      nameEn: true,
                      code: true,
                    },
                  },
                },
              },
              lot: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        }),
        ...(include.includes('vehicles') && {
          vehicles: {
            select: {
              id: true,
              licensePlate: true,
              make: true,
              model: true,
              color: true,
              vehicleType: {
                select: {
                  name: true,
                  nameEn: true,
                  code: true,
                },
              },
            },
          },
        }),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, phone, kennitala } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        phone,
        kennitala,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        kennitala: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Don't allow deleting yourself
    if (session.user?.id === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
