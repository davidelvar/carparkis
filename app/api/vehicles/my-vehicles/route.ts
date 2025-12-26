import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET user's registered vehicles and previously booked vehicles
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get vehicles owned by the user
    const ownedVehicles = await prisma.vehicle.findMany({
      where: { ownerId: session.user.id },
      include: {
        vehicleType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get vehicles from user's bookings (not owned)
    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      select: {
        vehicle: {
          include: {
            vehicleType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine owned + booked vehicles, avoiding duplicates
    const vehicleMap = new Map();
    
    // Add owned vehicles first (they take priority)
    for (const vehicle of ownedVehicles) {
      vehicleMap.set(vehicle.id, vehicle);
    }
    
    // Add vehicles from bookings that aren't already in the map
    for (const booking of bookings) {
      if (!vehicleMap.has(booking.vehicle.id)) {
        vehicleMap.set(booking.vehicle.id, booking.vehicle);
      }
    }

    const vehicles = Array.from(vehicleMap.values());

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
