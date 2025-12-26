import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET all vehicle types
export async function GET() {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: vehicleTypes });
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle types' },
      { status: 500 }
    );
  }
}
