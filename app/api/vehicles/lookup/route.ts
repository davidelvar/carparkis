import { NextRequest, NextResponse } from 'next/server';
import { lookupVehicle, lookupVehicleMock } from '@/lib/samgongustofa/client';
import { isValidIcelandicLicensePlate, normalizeLicensePlate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const plate = searchParams.get('plate');

  if (!plate) {
    return NextResponse.json(
      { success: false, error: 'License plate is required' },
      { status: 400 }
    );
  }

  const normalized = normalizeLicensePlate(plate);

  if (!isValidIcelandicLicensePlate(normalized)) {
    return NextResponse.json(
      { success: false, error: 'Invalid license plate format' },
      { status: 400 }
    );
  }

  try {
    // Use real rogg.is API, fall back to mock if it fails
    let vehicle = null;
    
    try {
      vehicle = await lookupVehicle(normalized);
    } catch (apiError) {
      console.error('Rogg.is API error, falling back to mock:', apiError);
      vehicle = await lookupVehicleMock(normalized);
    }

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Lookup failed' },
      { status: 500 }
    );
  }
}
