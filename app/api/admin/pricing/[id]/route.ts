import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/config';

// GET single pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pricing = await prisma.lotPricing.findUnique({
      where: { id },
      include: { vehicleType: true, lot: true },
    });

    if (!pricing) {
      return NextResponse.json(
        { success: false, error: 'Pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

// PATCH update pricing
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

    const pricing = await prisma.lotPricing.update({
      where: { id },
      data: body,
      include: { vehicleType: true, lot: true },
    });

    return NextResponse.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

// DELETE pricing
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

    await prisma.lotPricing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete pricing' },
      { status: 500 }
    );
  }
}
