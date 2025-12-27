import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST - Calculate pricing for a booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lotId, vehicleTypeId, dropOffTime, pickUpTime } = body;

    if (!lotId || !vehicleTypeId || !dropOffTime || !pickUpTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find pricing for this lot and vehicle type
    const pricing = await prisma.lotPricing.findFirst({
      where: {
        lotId,
        vehicleTypeId,
        isActive: true,
      },
    });

    if (!pricing) {
      return NextResponse.json(
        { success: false, error: 'No pricing found for this combination' },
        { status: 404 }
      );
    }

    // Calculate days
    const dropOff = new Date(dropOffTime);
    const pickUp = new Date(pickUpTime);
    const diffMs = pickUp.getTime() - dropOff.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Round up partial days (minimum 1 day)
    let totalDays = Math.ceil(diffHours / 24);
    if (totalDays < 1) totalDays = 1;

    // Calculate base price
    let pricePerDay = pricing.pricePerDay;
    let totalPrice = totalDays * pricePerDay;
    let discountPercent = 0;
    let discountAmount = 0;

    // Apply weekly discount if applicable (7+ days)
    if (totalDays >= 7 && pricing.weeklyDiscount && pricing.weeklyDiscount > 0) {
      discountPercent = pricing.weeklyDiscount;
      discountAmount = Math.round(totalPrice * (discountPercent / 100));
      totalPrice = totalPrice - discountAmount;
    }
    // Apply monthly discount if applicable (30+ days)
    else if (totalDays >= 30 && pricing.monthlyDiscount && pricing.monthlyDiscount > 0) {
      discountPercent = pricing.monthlyDiscount;
      discountAmount = Math.round(totalPrice * (discountPercent / 100));
      totalPrice = totalPrice - discountAmount;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalDays,
        pricePerDay,
        basePrice: totalDays * pricePerDay,
        discountPercent,
        discountAmount,
        totalPrice,
      },
    });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}
