import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET all service categories
export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, nameEn, code, icon, isActive = true } = body;

    // Generate code from name if not provided
    const categoryCode = code || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Get max sortOrder
    const maxOrder = await prisma.serviceCategory.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder || 0) + 1;

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        nameEn,
        code: categoryCode,
        icon,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
