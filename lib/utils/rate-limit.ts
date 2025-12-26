/**
 * Simple in-memory rate limiter
 * 
 * Tracks requests per IP and blocks excessive usage.
 * Note: In production with multiple instances, use Redis instead.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;  // Seconds until reset
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry if doesn't exist or window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);
  
  return { allowed, remaining, resetIn };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = request.headers;
  
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback - in development this might be localhost
  return 'unknown';
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
