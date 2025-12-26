import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET all services with lot pricing and categories
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        category: true,
        lotServices: {
          include: { 
            lot: true,
            vehicleType: true,
          },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: services, categories });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST create new service
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, nameEn, description, descriptionEn, code, icon, categoryId, isActive = true, pricing } = body;

    // Generate code from name if not provided
    const serviceCode = code || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Get max sortOrder
    const maxOrder = await prisma.service.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder || 0) + 1;

    // Get the default lot (first one)
    const defaultLot = await prisma.lot.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const service = await prisma.service.create({
      data: {
        name,
        nameEn,
        description,
        descriptionEn,
        code: serviceCode,
        icon,
        categoryId: categoryId || null,
        sortOrder,
        isActive,
      },
    });

    // Create pricing entries if provided
    if (pricing && defaultLot) {
      const pricingEntries = Object.entries(pricing as Record<string, number>)
        .filter(([_, price]) => price > 0)
        .map(([vehicleTypeId, price]) => ({
          serviceId: service.id,
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

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
