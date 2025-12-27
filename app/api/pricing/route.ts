import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Cache duration: 1 hour
const CACHE_MAX_AGE = 60 * 60;

// GET public pricing information
export async function GET() {
  try {
    // Get default/main lot
    const lot = await prisma.lot.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'No active parking lot found' },
        { status: 404 }
      );
    }

    // Get parking pricing per vehicle type
    const lotPricing = await prisma.lotPricing.findMany({
      where: { 
        lotId: lot.id,
        isActive: true,
      },
      include: {
        vehicleType: true,
      },
    });

    // Get active services with their pricing
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: true,
        lotServices: {
          where: { 
            lotId: lot.id,
            isAvailable: true,
          },
          include: {
            vehicleType: true,
          },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    // Get service categories
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Sort pricing by vehicle size
    const sizeOrder: Record<string, number> = { small: 1, medium: 2, large: 3, xlarge: 4 };
    const sortedPricing = lotPricing.sort((a, b) => {
      const orderA = sizeOrder[a.vehicleType.code] || 99;
      const orderB = sizeOrder[b.vehicleType.code] || 99;
      return orderA - orderB;
    });

    const response = NextResponse.json({
      success: true,
      data: {
        lot: {
          id: lot.id,
          name: lot.name,
          nameEn: lot.nameEn,
        },
        parking: sortedPricing.map(p => ({
          vehicleType: {
            id: p.vehicleType.id,
            name: p.vehicleType.name,
            nameEn: p.vehicleType.nameEn,
            code: p.vehicleType.code,
          },
          baseFee: p.baseFee,
          pricePerDay: p.pricePerDay,
          weeklyDiscount: p.weeklyDiscount,
          monthlyDiscount: p.monthlyDiscount,
        })),
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          nameEn: s.nameEn,
          description: s.description,
          descriptionEn: s.descriptionEn,
          icon: s.icon,
          category: s.category ? {
            id: s.category.id,
            name: s.category.name,
            nameEn: s.category.nameEn,
            code: s.category.code,
            icon: s.category.icon,
          } : null,
          pricing: s.lotServices.map(ls => ({
            vehicleType: {
              id: ls.vehicleType.id,
              name: ls.vehicleType.name,
              nameEn: ls.vehicleType.nameEn,
              code: ls.vehicleType.code,
            },
            price: ls.price,
          })),
        })),
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          code: c.code,
          icon: c.icon,
        })),
      },
    });

    // Cache for 1 hour
    response.headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`);

    return response;
  } catch (error) {
    console.error('Error fetching public pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}
