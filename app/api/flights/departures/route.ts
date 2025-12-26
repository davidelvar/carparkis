import { NextResponse } from 'next/server';
import { getDepartures } from '@/lib/isavia/client';
import { checkRateLimit, getClientIp, isAllowedOrigin } from '@/lib/utils/rate-limit';

// Rate limit: 30 requests per minute per IP
const RATE_LIMIT_CONFIG = { windowMs: 60 * 1000, maxRequests: 30 };

// Cache duration: 30 minutes (client-side)
const CACHE_MAX_AGE = 30 * 60;

export async function GET(request: Request) {
  // Check origin - only allow requests from our domain
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`flights:${clientIp}`, RATE_LIMIT_CONFIG);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetIn),
          'X-RateLimit-Remaining': '0',
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
    const flights = await getDepartures(date);

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
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    
    return response;
  } catch (error) {
    console.error('Error fetching departures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flight data' },
      { status: 500 }
    );
  }
}
