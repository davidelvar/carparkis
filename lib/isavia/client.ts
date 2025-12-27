/**
 * Isavia (KEF Airport) Flight Data Client
 * 
 * Fetches flight information from kefairport.com public pages.
 * Uses database caching (FlightCache table) to minimize requests and avoid rate limiting.
 * Shared across all users - customer booking and operator dashboard.
 */

import { prisma } from '@/lib/db/prisma';

export interface Flight {
  flightNumber: string;
  time: string; // "HH:MM"
  destination?: string; // For departures
  origin?: string; // For arrivals
  airline?: string;
  status: string;
}

export interface FlightData {
  date: string;
  flights: Flight[];
  fetchedAt: Date;
}

export interface FlightStatus {
  flightNumber: string;
  scheduledTime: string;
  estimatedTime?: string;
  actualTime?: string;
  status: string;
  destination?: string;
  airline?: string;
  isDelayed: boolean;
  delayMinutes?: number;
  fetchedAt: Date;
}

// In-memory cache as first-level cache (faster than DB)
const memoryCache: Map<string, FlightData> = new Map();
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (short, DB is source of truth)

// Database cache TTL settings
const DB_CACHE_TTL_FLIGHT_LIST_MS = 2 * 60 * 60 * 1000; // 2 hours for flight lists (customer booking)
const DB_CACHE_TTL_STATUS_MS = 30 * 60 * 1000; // 30 minutes for status checks (operator dashboard)

/**
 * Parse flight data from kefairport.com HTML response
 * 
 * The HTML structure uses:
 * - <tr class="FlightListItem_flightListItem__..."> for each flight row
 * - Time in first <td>, with possible <del> for original time and <time> for updated
 * - Destination/Origin in <span class="FlightListItem_flightListItem__destination__...">
 * - Flight number in <div class="FlightListNumbers_flightListNumbers__...">
 * - Status in <span class="Pill_pill__..."> inside status column
 */
function parseFlightsFromHtml(html: string, type: 'departures' | 'arrivals'): Flight[] {
  const flights: Flight[] = [];
  
  // Match each flight row
  const rowRegex = /<tr class="FlightListItem_flightListItem[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    
    try {
      // Extract time - look for <time> tag first (updated time), then fall back to first time pattern
      let time: string | null = null;
      const timeTagMatch = rowHtml.match(/<time[^>]*>(\d{2}:\d{2})<\/time>/i);
      if (timeTagMatch) {
        time = timeTagMatch[1];
      } else {
        // Look for time in del tag or plain text
        const timeMatch = rowHtml.match(/>(\d{2}:\d{2})</);
        if (timeMatch) {
          time = timeMatch[1];
        }
      }
      
      if (!time) continue; // Skip if no time found
      
      // Extract flight number from FlightListNumbers div
      const flightNumberMatch = rowHtml.match(/FlightListNumbers_flightListNumbers[^"]*"[^>]*>([A-Z0-9]+)<\/div>/i);
      if (!flightNumberMatch) continue; // Skip if no flight number
      const flightNumber = flightNumberMatch[1].toUpperCase();
      
      // Extract destination/origin from FlightListItem__destination span
      const destinationMatch = rowHtml.match(/FlightListItem_flightListItem__destination[^"]*"[^>]*>([^<]+)/i);
      const location = destinationMatch ? destinationMatch[1].trim() : 'Unknown';
      
      // Extract status from Pill span
      const statusMatch = rowHtml.match(/Pill_pill__[^"]*"[^>]*>([^<]+)<\/span>/i);
      const status = statusMatch ? statusMatch[1].trim() : 'On time';
      
      // Extract airline code from flight number (first 2-3 chars for letter codes, or handle numeric prefixes)
      const airlineCode = flightNumber.match(/^([A-Z]{2}|[A-Z]\d|\d[A-Z])/i)?.[1] || flightNumber.slice(0, 2);
      
      flights.push({
        flightNumber,
        time,
        ...(type === 'departures' ? { destination: location } : { origin: location }),
        airline: getAirlineName(airlineCode.toUpperCase()),
        status,
      });
    } catch (e) {
      // Skip malformed rows
      console.error('[Isavia] Error parsing flight row:', e);
    }
  }
  
  // Sort by time
  flights.sort((a, b) => a.time.localeCompare(b.time));
  
  return flights;
}

/**
 * Map airline codes to names (common airlines at KEF)
 */
function getAirlineName(code: string): string {
  const airlines: Record<string, string> = {
    'FI': 'Icelandair',
    'WW': 'WOW air',
    'OG': 'PLAY',
    'BA': 'British Airways',
    'SK': 'SAS',
    'AY': 'Finnair',
    'LH': 'Lufthansa',
    'EZY': 'easyJet',
    'EJU': 'easyJet',
    'W6': 'Wizz Air',
    'HV': 'Transavia',
    'TO': 'Transavia France',
    'BT': 'airBaltic',
    'NO': 'Neos',
    'WK': 'Edelweiss',
    'QS': 'SmartWings',
    '4Y': 'Eurowings Discover',
  };
  return airlines[code] || code;
}

/**
 * Convert time string "HH:MM" to Date object for a given date
 */
function timeToDate(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Save flights to database cache
 */
async function saveFlightsToDb(
  date: string,
  type: 'departures' | 'arrivals',
  flights: Flight[]
): Promise<void> {
  const direction = type === 'departures' ? 'departure' : 'arrival';
  const flightDate = new Date(date);
  
  try {
    // Use upsert for each flight
    await Promise.all(
      flights.map(async (flight) => {
        const scheduledTime = timeToDate(date, flight.time);
        
        await prisma.flightCache.upsert({
          where: {
            flightNumber_flightDate_direction: {
              flightNumber: flight.flightNumber,
              flightDate,
              direction,
            },
          },
          update: {
            scheduledTime,
            destination: flight.destination || flight.origin,
            airline: flight.airline,
            rawData: { status: flight.status },
            fetchedAt: new Date(),
          },
          create: {
            flightNumber: flight.flightNumber,
            flightDate,
            direction,
            scheduledTime,
            destination: flight.destination || flight.origin,
            airline: flight.airline,
            rawData: { status: flight.status },
          },
        });
      })
    );
    console.log(`[Isavia] Saved ${flights.length} ${type} to database cache`);
  } catch (error) {
    console.error(`[Isavia] Error saving to database:`, error);
  }
}

/**
 * Get flights from database cache
 */
async function getFlightsFromDb(
  date: string,
  type: 'departures' | 'arrivals',
  maxAge: number
): Promise<FlightData | null> {
  const direction = type === 'departures' ? 'departure' : 'arrival';
  const flightDate = new Date(date);
  const minFetchedAt = new Date(Date.now() - maxAge);
  
  try {
    const cachedFlights = await prisma.flightCache.findMany({
      where: {
        flightDate,
        direction,
        fetchedAt: { gte: minFetchedAt },
      },
      orderBy: { scheduledTime: 'asc' },
    });
    
    if (cachedFlights.length === 0) {
      return null;
    }
    
    // Get the oldest fetchedAt to determine cache age
    const oldestFetch = cachedFlights.reduce(
      (min, f) => (f.fetchedAt < min ? f.fetchedAt : min),
      cachedFlights[0].fetchedAt
    );
    
    const flights: Flight[] = cachedFlights.map((f) => ({
      flightNumber: f.flightNumber,
      time: f.scheduledTime.toTimeString().slice(0, 5), // "HH:MM"
      ...(type === 'departures' ? { destination: f.destination || undefined } : { origin: f.destination || undefined }),
      airline: f.airline || undefined,
      status: (f.rawData as { status?: string })?.status || 'On time',
    }));
    
    return {
      date,
      flights,
      fetchedAt: oldestFetch,
    };
  } catch (error) {
    console.error(`[Isavia] Error reading from database:`, error);
    return null;
  }
}

/**
 * Fetch fresh flight data from Isavia website
 */
async function fetchFromIsavia(
  date: string,
  type: 'departures' | 'arrivals'
): Promise<Flight[]> {
  console.log(`[Isavia] Fetching ${type} for ${date} from kefairport.com`);
  
  const url = `https://www.kefairport.com/flights/${type}?date=${date}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,is;q=0.8',
      'Cache-Control': 'no-cache',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  return parseFlightsFromHtml(html, type);
}

/**
 * Fetch flights for a specific date with database caching
 */
export async function fetchFlights(
  date: string, // YYYY-MM-DD
  type: 'departures' | 'arrivals'
): Promise<FlightData> {
  const cacheKey = `${type}-${date}`;
  
  // Level 1: Check in-memory cache (very fast, short TTL)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached && Date.now() - memoryCached.fetchedAt.getTime() < MEMORY_CACHE_TTL_MS) {
    console.log(`[Isavia] Memory cache hit for ${cacheKey}`);
    return memoryCached;
  }
  
  // Level 2: Check database cache
  const dbCached = await getFlightsFromDb(date, type, DB_CACHE_TTL_FLIGHT_LIST_MS);
  if (dbCached) {
    console.log(`[Isavia] Database cache hit for ${cacheKey}`);
    // Update memory cache
    memoryCache.set(cacheKey, dbCached);
    return dbCached;
  }
  
  // Level 3: Fetch fresh data from Isavia
  try {
    const flights = await fetchFromIsavia(date, type);
    
    const data: FlightData = {
      date,
      flights,
      fetchedAt: new Date(),
    };
    
    // Save to both caches
    memoryCache.set(cacheKey, data);
    await saveFlightsToDb(date, type, flights);
    
    console.log(`[Isavia] Found ${flights.length} ${type} for ${date}`);
    return data;
    
  } catch (error) {
    console.error(`[Isavia] Error fetching ${type} for ${date}:`, error);
    
    // Try to return stale database cache as fallback
    const staleCached = await getFlightsFromDb(date, type, 24 * 60 * 60 * 1000); // 24hr fallback
    if (staleCached) {
      console.log(`[Isavia] Returning stale database cache for ${cacheKey}`);
      return staleCached;
    }
    
    // Return memory cache if available
    if (memoryCached) {
      console.log(`[Isavia] Returning stale memory cache for ${cacheKey}`);
      return memoryCached;
    }
    
    // Return empty result
    return {
      date,
      flights: [],
      fetchedAt: new Date(),
    };
  }
}

/**
 * Get departing flights from KEF for a specific date
 */
export async function getDepartures(date: string): Promise<Flight[]> {
  const data = await fetchFlights(date, 'departures');
  return data.flights;
}

/**
 * Get arriving flights to KEF for a specific date
 */
export async function getArrivals(date: string): Promise<Flight[]> {
  const data = await fetchFlights(date, 'arrivals');
  return data.flights;
}

/**
 * Get status for specific flight numbers (for operator dashboard)
 * Uses shorter cache TTL for more real-time status updates
 */
export async function getFlightStatuses(
  flightNumbers: string[],
  date: string,
  type: 'departures' | 'arrivals'
): Promise<FlightStatus[]> {
  if (flightNumbers.length === 0) return [];
  
  const direction = type === 'departures' ? 'departure' : 'arrival';
  const flightDate = new Date(date);
  const minFetchedAt = new Date(Date.now() - DB_CACHE_TTL_STATUS_MS);
  
  // Check which flights we have in fresh cache
  const cachedFlights = await prisma.flightCache.findMany({
    where: {
      flightNumber: { in: flightNumbers },
      flightDate,
      direction,
    },
  });
  
  // Check if cache is fresh enough for status
  const needsFresh = cachedFlights.length === 0 || 
    cachedFlights.some(f => f.fetchedAt < minFetchedAt);
  
  if (needsFresh) {
    // Fetch fresh data (this will update the cache)
    await fetchFlights(date, type);
    
    // Re-fetch from database
    const freshFlights = await prisma.flightCache.findMany({
      where: {
        flightNumber: { in: flightNumbers },
        flightDate,
        direction,
      },
    });
    
    return freshFlights.map(flightToStatus);
  }
  
  return cachedFlights.map(flightToStatus);
}

/**
 * Convert database flight record to FlightStatus
 */
function flightToStatus(f: {
  flightNumber: string;
  scheduledTime: Date;
  estimatedTime: Date | null;
  actualTime: Date | null;
  destination: string | null;
  airline: string | null;
  rawData: unknown;
  fetchedAt: Date;
}): FlightStatus {
  const rawData = f.rawData as { status?: string } | null;
  const status = rawData?.status || 'On time';
  
  // Calculate delay
  let isDelayed = false;
  let delayMinutes: number | undefined;
  
  if (f.estimatedTime && f.scheduledTime) {
    const diff = f.estimatedTime.getTime() - f.scheduledTime.getTime();
    delayMinutes = Math.round(diff / (1000 * 60));
    isDelayed = delayMinutes > 15; // Consider delayed if > 15 min
  }
  
  // Check status text for delay indicators
  if (status.toLowerCase().includes('delay') || status.toLowerCase().includes('seinkað')) {
    isDelayed = true;
  }
  
  return {
    flightNumber: f.flightNumber,
    scheduledTime: f.scheduledTime.toTimeString().slice(0, 5),
    estimatedTime: f.estimatedTime?.toTimeString().slice(0, 5),
    actualTime: f.actualTime?.toTimeString().slice(0, 5),
    status,
    destination: f.destination || undefined,
    airline: f.airline || undefined,
    isDelayed,
    delayMinutes,
    fetchedAt: f.fetchedAt,
  };
}

/**
 * Clear the in-memory cache (useful for testing)
 */
export function clearCache(): void {
  memoryCache.clear();
}
