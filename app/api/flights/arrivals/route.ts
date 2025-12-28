import { NextResponse } from 'next/server';
import { getArrivals } from '@/lib/isavia/client';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

// Cache duration: 30 minutes (client-side)
const CACHE_MAX_AGE = 30 * 60;

export async function GET(request: Request) {
  // Rate limiting (origin check removed - public flight data)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  const { success, remaining, reset } = rateLimit(ip, 'flights', rateLimits.flights);
  
  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Missing date parameter (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  // Only allow dates within reasonable range (today to 30 days ahead)
  const requestedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  
  if (requestedDate < today || requestedDate > maxDate) {
    return NextResponse.json(
      { success: false, error: 'Date must be between today and 30 days from now' },
      { status: 400 }
    );
  }

  try {
    const flights = await getArrivals(date);

    const response = NextResponse.json({
      success: true,
      data: {
        date,
        flights,
        count: flights.length,
      },
    });

    // Add cache headers
    response.headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    
    return response;
  } catch (error) {
    console.error('Error fetching arrivals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flight data' },
      { status: 500 }
    );
  }
}
