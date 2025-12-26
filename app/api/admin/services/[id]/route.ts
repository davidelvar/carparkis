import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        lotServices: {
          include: { lot: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PATCH update service
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
    const { pricing, ...serviceData } = body;

    // Update service basic data
    const service = await prisma.service.update({
      where: { id },
      data: serviceData,
    });

    // Update pricing if provided
    if (pricing) {
      // Get the default lot
      const defaultLot = await prisma.lot.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (defaultLot) {
        // Delete existing pricing for this service
        await prisma.lotService.deleteMany({
          where: { serviceId: id },
        });

        // Create new pricing entries
        const pricingEntries = Object.entries(pricing as Record<string, number>)
          .filter(([_, price]) => price > 0)
          .map(([vehicleTypeId, price]) => ({
            serviceId: id,
            lotId: defaultLot.id,
            vehicleTypeId,
            price: price as number,
          }));

        if (pricingEntries.length > 0) {
          await prisma.lotService.createMany({
            data: pricingEntries,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE service
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

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
