import { NextResponse } from 'next/server';
import { getFlightStatuses, type FlightStatus } from '@/lib/isavia/client';
import { rateLimit, rateLimits, isAllowedOrigin } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

// Cache duration: 5 minutes (client-side) - shorter for status updates
const CACHE_MAX_AGE = 5 * 60;

export async function GET(request: Request) {
  // Check origin - only allow requests from our domain
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // This endpoint is primarily for operators
  const session = await auth();
  if (!session?.user || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Rate limiting
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
  const flightsParam = searchParams.get('flights'); // comma-separated flight numbers
  const type = searchParams.get('type') as 'departures' | 'arrivals' | null;

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Missing date parameter (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  if (!flightsParam) {
    return NextResponse.json(
      { success: false, error: 'Missing flights parameter (comma-separated flight numbers)' },
      { status: 400 }
    );
  }

  if (!type || !['departures', 'arrivals'].includes(type)) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid type parameter (departures/arrivals)' },
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

  // Parse flight numbers
  const flightNumbers = flightsParam
    .split(',')
    .map(f => f.trim().toUpperCase())
    .filter(f => f.length > 0)
    .slice(0, 50); // Limit to 50 flights per request

  if (flightNumbers.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid flight numbers provided' },
      { status: 400 }
    );
  }

  try {
    const statuses = await getFlightStatuses(flightNumbers, date, type);

    // Create a map for easy lookup
    const statusMap: Record<string, FlightStatus> = {};
    statuses.forEach(s => {
      statusMap[s.flightNumber] = s;
    });

    const response = NextResponse.json({
      success: true,
      data: {
        date,
        type,
        statuses: statusMap,
        count: statuses.length,
        requestedCount: flightNumbers.length,
      },
    });

    // Add cache headers
    response.headers.set('Cache-Control', `private, max-age=${CACHE_MAX_AGE}`);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    
    return response;
  } catch (error) {
    console.error('Error fetching flight statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flight status data' },
      { status: 500 }
    );
  }
}
