import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
  limit: number; // Max requests per token per interval
};

const rateLimiters = new Map<string, LRUCache<string, number[]>>();

function getRateLimiter(name: string, options: RateLimitOptions) {
  if (!rateLimiters.has(name)) {
    rateLimiters.set(
      name,
      new LRUCache({
        max: options.uniqueTokenPerInterval,
        ttl: options.interval,
      })
    );
  }
  return rateLimiters.get(name)!;
}

/**
 * Rate limit by IP address
 * @param ip - Client IP address
 * @param name - Unique name for this rate limiter (e.g., 'booking', 'vehicle-lookup')
 * @param options - Rate limit configuration
 */
export function rateLimit(
  ip: string,
  name: string,
  options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    limit: 10, // 10 requests per minute by default
  }
): { success: boolean; remaining: number; reset: number } {
  const limiter = getRateLimiter(name, options);
  
  const now = Date.now();
  const windowStart = now - options.interval;
  
  // Get existing requests for this IP
  const requests = limiter.get(ip) || [];
  
  // Filter to only requests within the current window
  const recentRequests = requests.filter((timestamp) => timestamp > windowStart);
  
  // Check if limit exceeded
  if (recentRequests.length >= options.limit) {
    const oldestRequest = recentRequests[0];
    const resetTime = oldestRequest + options.interval;
    
    return {
      success: false,
      remaining: 0,
      reset: resetTime,
    };
  }
  
  // Add current request
  recentRequests.push(now);
  limiter.set(ip, recentRequests);
  
  return {
    success: true,
    remaining: options.limit - recentRequests.length,
    reset: now + options.interval,
  };
}

/**
 * Check if request is from allowed origin
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // In development, allow localhost
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);
  
  // Check origin header
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
    return true;
  }
  
  // Check referer header
  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed!))) {
    return true;
  }
  
  // Allow server-side requests (no origin/referer) - these are internal
  if (!origin && !referer) {
    return true;
  }
  
  return false;
}

// Pre-configured rate limiters for different use cases
export const rateLimits = {
  // Very strict - for sensitive operations
  strict: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    limit: 5, // 5 requests per minute
  },
  // Standard - for general API use
  standard: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    limit: 30, // 30 requests per minute
  },
  // Lenient - for public data endpoints
  lenient: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    limit: 60, // 60 requests per minute
  },
  // Booking creation - prevent spam
  booking: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    limit: 10, // 10 bookings per minute max
  },
  // Vehicle lookup - prevent registry scraping
  vehicleLookup: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    limit: 20, // 20 lookups per minute
  },
  // Flight lookups - external API
  flights: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
    limit: 30, // 30 requests per minute
  },
};
