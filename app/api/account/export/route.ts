import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

// GET /api/account/export - Export all user data (GDPR)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        bookings: {
          include: {
            vehicle: {
              include: {
                vehicleType: true,
              },
            },
            lot: true,
            addons: {
              include: {
                service: true,
              },
            },
          },
        },
        vehicles: {
          include: {
            vehicleType: true,
          },
        },
        accounts: {
          select: {
            provider: true,
            type: true,
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

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      vehicles: user.vehicles.map((v: any) => ({
        id: v.id,
        licensePlate: v.licensePlate,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        isElectric: v.isElectric,
        vehicleType: v.vehicleType?.name,
        createdAt: v.createdAt,
      })),
      bookings: user.bookings.map((b: any) => ({
        id: b.id,
        reference: b.reference,
        status: b.status,
        dropOffTime: b.dropOffTime,
        pickUpTime: b.pickUpTime,
        totalDays: b.totalDays,
        totalPrice: b.totalPrice,
        vehicle: {
          licensePlate: b.vehicle.licensePlate,
          make: b.vehicle.make,
          model: b.vehicle.model,
        },
        lot: {
          name: b.lot.name,
        },
        addons: b.addons.map((a: any) => ({
          service: a.service.name,
          price: a.price,
          status: a.status,
        })),
        createdAt: b.createdAt,
      })),
      linkedAccounts: user.accounts.map((a: any) => ({
        provider: a.provider,
        type: a.type,
      })),
    };

    // Return as downloadable JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Failed to export account data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export account data' },
      { status: 500 }
    );
  }
}
