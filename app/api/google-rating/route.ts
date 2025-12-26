import { NextResponse } from 'next/server';

// Cache the rating for 24 hours to avoid excessive API calls
let cachedRating: { rating: number; reviewCount: number; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    // Check cache first
    if (cachedRating && Date.now() - cachedRating.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rating: cachedRating.rating,
        reviewCount: cachedRating.reviewCount,
        cached: true,
      });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      // Return default values if not configured
      return NextResponse.json({
        success: true,
        rating: 4.9,
        reviewCount: 0,
        configured: false,
      });
    }

    // Fetch from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour at edge
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Places API');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json({
        success: true,
        rating: 4.9,
        reviewCount: 0,
        error: data.status,
      });
    }

    const rating = data.result?.rating || 4.9;
    const reviewCount = data.result?.user_ratings_total || 0;

    // Update cache
    cachedRating = {
      rating,
      reviewCount,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      rating,
      reviewCount,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching Google rating:', error);
    return NextResponse.json({
      success: true,
      rating: 4.9,
      reviewCount: 0,
      error: 'Failed to fetch rating',
    });
  }
}
