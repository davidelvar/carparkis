import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET all vehicle types
export async function GET() {
  try {
    const vehicleTypes = await prisma.vehicleType.findMany();
    
    // Sort by logical size order: small, medium, large, xlarge
    const sizeOrder: Record<string, number> = { small: 1, medium: 2, large: 3, xlarge: 4 };
    vehicleTypes.sort((a, b) => (sizeOrder[a.code] || 99) - (sizeOrder[b.code] || 99));

    return NextResponse.json({ success: true, data: vehicleTypes });
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle types' },
      { status: 500 }
    );
  }
}
