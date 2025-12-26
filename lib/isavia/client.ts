/**
 * Isavia (KEF Airport) Flight Data Client
 * 
 * Fetches flight information from kefairport.com public pages.
 * Uses server-side caching to minimize requests and avoid rate limiting.
 */

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

// Simple in-memory cache
const cache: Map<string, FlightData> = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

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
 * Fetch flights for a specific date
 */
export async function fetchFlights(
  date: string, // YYYY-MM-DD
  type: 'departures' | 'arrivals'
): Promise<FlightData> {
  const cacheKey = `${type}-${date}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    console.log(`[Isavia] Cache hit for ${cacheKey}`);
    return cached;
  }
  
  console.log(`[Isavia] Fetching ${type} for ${date}`);
  
  try {
    const url = `https://www.kefairport.com/flights/${type}?date=${date}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,is;q=0.8',
        'Cache-Control': 'no-cache',
      },
      // Don't follow redirects (could indicate blocking)
      redirect: 'manual',
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const flights = parseFlightsFromHtml(html, type);
    
    const data: FlightData = {
      date,
      flights,
      fetchedAt: new Date(),
    };
    
    // Cache the result
    cache.set(cacheKey, data);
    
    console.log(`[Isavia] Found ${flights.length} ${type} for ${date}`);
    return data;
    
  } catch (error) {
    console.error(`[Isavia] Error fetching ${type} for ${date}:`, error);
    
    // Return cached data even if stale, if available
    if (cached) {
      console.log(`[Isavia] Returning stale cache for ${cacheKey}`);
      return cached;
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
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}
