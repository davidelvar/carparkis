import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Cache duration: 1 hour (client-side)
const CACHE_MAX_AGE = 60 * 60;

// GET active service categories (public, cached)
export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        icon: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const response = NextResponse.json({ 
      success: true, 
      data: categories,
    });

    // Cache for 1 hour - these don't change often
    response.headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`);
    
    return response;
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
