import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isValidIcelandicLicensePlate, normalizeLicensePlate } from '@/lib/utils';
import { lookupVehicle, lookupVehicleMock } from '@/lib/samgongustofa/client';

// GET /api/vehicles - Get user's vehicles
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId: session.user.id },
      include: {
        vehicleType: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Add a new vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { licensePlate } = body;

    if (!licensePlate) {
      return NextResponse.json(
        { success: false, error: 'License plate is required' },
        { status: 400 }
      );
    }

    const normalized = normalizeLicensePlate(licensePlate);

    if (!isValidIcelandicLicensePlate(normalized)) {
      return NextResponse.json(
        { success: false, error: 'Invalid license plate format' },
        { status: 400 }
      );
    }

    // Check if vehicle already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: normalized },
      include: { owner: true },
    });

    if (existingVehicle) {
      // If vehicle exists and belongs to this user, return it
      if (existingVehicle.ownerId === session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Vehicle already registered to your account' },
          { status: 400 }
        );
      }
      // If vehicle belongs to someone else
      if (existingVehicle.ownerId) {
        return NextResponse.json(
          { success: false, error: 'Vehicle is registered to another user' },
          { status: 400 }
        );
      }
      // Vehicle exists but has no owner - claim it
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: existingVehicle.id },
        data: { ownerId: session.user.id },
        include: { vehicleType: true },
      });
      return NextResponse.json({ success: true, data: updatedVehicle });
    }

    // Lookup vehicle info from registry
    let vehicleInfo = null;
    try {
      vehicleInfo = await lookupVehicle(normalized);
    } catch (apiError) {
      console.error('Registry API error, using mock:', apiError);
      vehicleInfo = await lookupVehicleMock(normalized);
    }

    // Get vehicle type (default to sedan if not found)
    let vehicleType = await prisma.vehicleType.findFirst({
      where: { code: vehicleInfo?.vehicleTypeCode || 'sedan' },
    });

    if (!vehicleType) {
      vehicleType = await prisma.vehicleType.findFirst({
        where: { code: 'sedan' },
      });
    }

    if (!vehicleType) {
      return NextResponse.json(
        { success: false, error: 'Vehicle type configuration error' },
        { status: 500 }
      );
    }

    // Create new vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        licensePlate: normalized,
        make: vehicleInfo?.make || null,
        model: vehicleInfo?.model || null,
        year: vehicleInfo?.year || null,
        color: vehicleInfo?.color || null,
        isElectric: vehicleInfo?.isElectric || false,
        vehicleTypeId: vehicleType.id,
        ownerId: session.user.id,
        rawApiData: vehicleInfo as any,
        lastApiSync: new Date(),
      },
      include: { vehicleType: true },
    });

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Failed to add vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add vehicle' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles - Remove a vehicle
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('id');

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (vehicle.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check for active bookings
    if (vehicle.bookings.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove vehicle with active bookings' },
        { status: 400 }
      );
    }

    // Remove ownership (don't delete the vehicle as it may have booking history)
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { ownerId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove vehicle' },
      { status: 500 }
    );
  }
}
