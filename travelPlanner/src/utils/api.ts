import type { GeoLocation, NearbyPlace, DailyWeather, PriceEstimate, NearbyPlacesData } from '@/types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

// Use Vite proxy in dev, direct URL in production build
const OVERPASS_URL = 'https://overpass.openstreetmap.fr/api/interpreter';

/* ─── Helpers ─── */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOverpass(body: string, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body,
        // Removed 'User-Agent': Browsers forbid setting this manually 
        // and it can trigger a failed CORS preflight request.
      });

      if (res.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Overpass rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      if (res.ok) return res;
      return res;
    } catch (err) {
      console.warn('Overpass fetch failed:', err);
      if (attempt < retries) await sleep(1000);
    }
  }
  throw new Error('Overpass request failed after retries');
}

function getCacheKey(lat: number, lon: number): string {
  return `td_nearby_${lat.toFixed(3)}_${lon.toFixed(3)}`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyPlace(tags: Record<string, string>): NearbyPlace['type'] | null {
  if (tags.tourism === 'hotel') return 'hotel';
  if (tags.aeroway === 'aerodrome') return 'airport';
  if (tags.leisure === 'golf_course') return 'golf';
  if (
    tags.tourism?.match(/attraction|museum|zoo|theme_park/) ||
    tags.leisure?.match(/park|nature_reserve|sports_centre/)
  )
    return 'activity';
  return null;
}

/* ─── Public APIs ─── */

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=10`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en-US' } });
  const data = await res.json();
  return data.map((item: GeoLocation) => ({
    ...item,
    name: item.display_name.split(',')[0],
  }));
}

export async function getNearbyPlaces(
  lat: number,
  lon: number,
  radius: number = 20000
): Promise<NearbyPlacesData> {
  const cacheKey = getCacheKey(lat, lon);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed._timestamp < 24 * 60 * 60 * 1000) {
        delete parsed._timestamp;
        return parsed as NearbyPlacesData; // Cast the cached data
      }
    }
  } catch {
    // ignore
  }

  const overpassQuery = `
    [out:json][timeout:60];
    (
      node["tourism"="hotel"](around:${radius},${lat},${lon});
      way["tourism"="hotel"](around:${radius},${lat},${lon});
      node["aeroway"="aerodrome"](around:${radius * 3},${lat},${lon});
      node["leisure"="golf_course"](around:${radius * 2},${lat},${lon});
      way["leisure"="golf_course"](around:${radius * 2},${lat},${lon});
      node["tourism"~"attraction|museum|zoo|theme_park"](around:${radius},${lat},${lon});
      node["leisure"~"park|nature_reserve|sports_centre"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  const res = await fetchOverpass(overpassQuery);
  const data = await res.json();

  const buckets: NearbyPlacesData = {
    hotels: [],
    airports: [],
    golf: [],
    activities: [],
  };

  for (const el of data.elements || []) {
    if (!el.tags) continue;
    if (el.tags.aerodrome === 'closed' || el.tags.aerodrome === 'abandoned') continue;
    const type = classifyPlace(el.tags);
    if (!type) continue;

    const elLat = el.lat ?? el.center?.lat ?? lat;
    const elLon = el.lon ?? el.center?.lon ?? lon;
    const dist = haversine(lat, lon, elLat, elLon);

    const place: NearbyPlace = {
      id: el.id,
      lat: elLat,
      lon: elLon,
      tags: el.tags,
      distance: Math.round(dist),
      type,
    };

    // Use a type-safe way to determine the bucket key
    let bucketKey: keyof NearbyPlacesData = 'activities'; // Default
    if (type === 'hotel') bucketKey = 'hotels';
    else if (type === 'airport') bucketKey = 'airports';
    else if (type === 'golf') bucketKey = 'golf';

    buckets[bucketKey].push(place);
  }

  // Fix the indexing error by casting the key as keyof NearbyPlacesData
  const keys = Object.keys(buckets) as Array<keyof NearbyPlacesData>;
  for (const key of keys) {
    buckets[key] = buckets[key]
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 15);
  }

  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ ...buckets, _timestamp: Date.now() })
    );
  } catch {
    // silently skip
  }

  return buckets;
}

export async function getHistoricalWeather(lat: number, lon: number): Promise<DailyWeather[]> {
  // Fetch the full range to ensure we have all leap years and edge cases covered
  const start = '2015-02-01';
  const end = '2024-04-30';
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=temperature_2m_mean,temperature_2m_max&temperature_unit=fahrenheit`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.daily?.time || !data.daily.temperature_2m_mean) {
      return [];
    }

    const dailyDataMap = new Map<string, { avgSum: number; maxSum: number; count: number }>();
    const times = data.daily.time;
    const means = data.daily.temperature_2m_mean;
    const maxs = data.daily.temperature_2m_max;

    // Group by MM-DD across all 10 years
    for (let i = 0; i < times.length; i++) {
      const dateStr = times[i]; // e.g., "2015-02-15"

      // Extract month to filter for Feb (2), Mar (3), Apr (4)
      const monthNum = parseInt(dateStr.substring(5, 7), 10);
      if (monthNum < 2 || monthNum > 4) continue;

      const monthDay = dateStr.substring(5); // e.g., "02-15"

      if (!dailyDataMap.has(monthDay)) {
        dailyDataMap.set(monthDay, { avgSum: 0, maxSum: 0, count: 0 });
      }

      const entry = dailyDataMap.get(monthDay)!;
      if (means[i] !== null && maxs[i] !== null) {
        entry.avgSum += means[i];
        entry.maxSum += maxs[i];
        entry.count += 1;
      }
    }

    const result: DailyWeather[] = [];
    const sortedKeys = Array.from(dailyDataMap.keys()).sort();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const key of sortedKeys) {
      const entry = dailyDataMap.get(key)!;
      if (entry.count === 0) continue;

      const [month, day] = key.split('-');
      const formattedDay = `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;

      result.push({
        day: formattedDay,
        avgTemp: Math.round((entry.avgSum / entry.count) * 10) / 10,
        maxTemp: Math.round((entry.maxSum / entry.count) * 10) / 10,
      });
    }

    return result;
  } catch (err) {
    console.error('Failed to fetch historical weather:', err);
    return [];
  }
}

export function getPriceEstimates(locationName: string, state: string): PriceEstimate[] {
  const region = getRegion(state);
  const hotelBase = region === 'west' ? 180 : region === 'northeast' ? 220 : region === 'south' ? 140 : 160;
  const colBase = region === 'west' ? 1.15 : region === 'northeast' ? 1.2 : region === 'south' ? 0.9 : 1.0;

  const isMajorCity = /New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|Nashville|El Paso|Detroit|Oklahoma City|Portland|Las Vegas|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Mesa|Kansas City|Atlanta|Long Beach|Colorado Springs|Raleigh|Miami|Virginia Beach|Omaha|Oakland|Minneapolis|Tulsa|Arlington|New Orleans|Wichita|Cleveland|Tampa|Bakersfield|Aurora|Anaheim|Honolulu|Santa Ana|Riverside|Corpus Christi|Lexington|Stockton|Henderson|Saint Paul|St\. Paul|Cincinnati|St\. Louis|Pittsburgh|Greensboro|Lincoln|Anchorage|Plano|Orlando|Irvine|Newark|Durham|Chula Vista|Toledo|Fort Wayne|St\. Petersburg|Laredo|Jersey City|Chandler|Madison|Lubbock|Scottsdale|Reno|Buffalo|Gilbert|Glendale|North Las Vegas|Winston\.Salem|Chesapeake|Norfolk|Fremont|Garland|Irving|Hialeah|Richmond|Boise|Spokane|Baton Rouge|Des Moines|Tacoma|San Bernardino|Modesto|Fontana|Santa Clarita|Birmingham|Oxnard|Fayetteville|Moreno Valley|Rochester|Glendale|Huntington Beach|Yonkers|Aurora|Montgomery|Amarillo|Little Rock|Akron|Grand Rapids|Augusta|Mobile|Columbus|Shreveport|Salt Lake City|Huntsville|Knoxville|Grand Prairie|Worcester|Brownsville|Overland Park|Providence|Jackson|Garden Grove|Oceanside|Chattanooga|Fort Lauderdale|Rancho Cucamonga|Santa Rosa|Port St\. Lucie|Ontario|Vancouver|Tempe|Springfield|Lancaster|Eugene|Pembroke Pines|Salem|Cape Coral|Peoria|Sioux Falls|Springfield|Elk Grove|Pomona|Pasadena|Joliet|Paterson|Kansas City|Torrance|Syracuse|Bridgeport|Hayward|Fort Collins|Escondido|Lakewood|Naperville|Dayton|Hollywood|Sunnyvale|Alexandria|Mesquite|Hampton|Pasadena|Orange|Fullerton|Killeen|Frisco|McKinney|McAllen|Bellevue|Miramar|Hampton|Warren|Clarksville|Round Rock|Topeka|Thousand Oaks|Waco|Cedar Rapids|Charleston|Visalia|Meridian|Elizabeth|Gainesville|Carrollton|Coral Springs|Stamford|Simi Valley|Concord|Hartford|Kent|Lafayette|Midland|Surprise|Denton|Victorville|Evansville|Santa Clara|Athens|Allentown|Abilene|Beaumont|Wilmington|Arvada|Provo|Independence|Lansing|Ann Arbor|Athens|Berkeley|Vallejo|Norman|Ann Arbor|Beaumont|Independence|Provo|El Monte|Downey|Berkeley|Midland|Norman|Waterbury|Costa Mesa|Inglewood|Miami Gardens|Manchester|Elgin|Wilmington|Westminster|Rochester|Clearwater|Lowell|Gresham|Cambridge|High Point|Antioch|Temecula|Fairfield|Carlsbad|West Covina|Murrieta|Richardson|North Charleston|Broken Arrow|Boulder|West Jordan|El Cajon|Edison|Daly City|Hillsboro|Sandy Springs|Norwalk|Green Bay|Tyler|Wichita Falls|Lewisville|Burbank|Greeley|San Mateo|League City|Santa Maria|Bend|Vacaville|Edinburg|Clinton|Clovis|Kenosha|Davenport|Sparks|Allen|Independence|Richardson|Westminster|Broken Arrow|Peoria|Lakewood|Carlsbad|Fairfield|Camden|Nampa|Roanoke|Duluth|Billings|West Palm Beach|Midland|Menifee|Meridian|St\. George|Concord|Sunrise|Santa Monica|Santa Barbara|San Leandro|San Marcos|San Angelo|Quincy|Palm Coast|Palm Bay|Orem|Ogden|O'Fallon|Napa|Missoula|Milpitas|Miami Beach|Merced|McKinney|Marysville|Lynn|Livonia|Lee's Summit|Lawton|Lawrence|Largo|Lauderhill|Las Cruces|Lakeland|Lake Forest|Kirkland|Jurupa Valley|Joliet/.test(locationName);

  const cityMultiplier = isMajorCity ? 1.4 : 1.0;

  return [
    {
      category: 'Flights (Round Trip)',
      items: [
        { name: 'From Boston (BOS)', low: Math.round(180 * colBase * cityMultiplier), high: Math.round(420 * colBase * cityMultiplier), unit: 'USD' },
        { name: 'From New York (JFK/LGA)', low: Math.round(160 * colBase * cityMultiplier), high: Math.round(380 * colBase * cityMultiplier), unit: 'USD' },
        { name: 'From Bradley (BDL)', low: Math.round(200 * colBase * cityMultiplier), high: Math.round(460 * colBase * cityMultiplier), unit: 'USD' },
      ],
    },
    {
      category: 'Hotels (Per Night)',
      items: [
        { name: 'Budget / 2-Star', low: Math.round(hotelBase * 0.5 * cityMultiplier), high: Math.round(hotelBase * 0.8 * cityMultiplier), unit: 'USD' },
        { name: 'Mid-Range / 3-Star', low: Math.round(hotelBase * 0.9 * cityMultiplier), high: Math.round(hotelBase * 1.3 * cityMultiplier), unit: 'USD' },
        { name: 'Luxury / 4-5 Star', low: Math.round(hotelBase * 1.5 * cityMultiplier), high: Math.round(hotelBase * 2.5 * cityMultiplier), unit: 'USD' },
      ],
    },
    {
      category: 'Cost of Living (Monthly)',
      items: [
        { name: '1BR Apartment Rent', low: Math.round(900 * colBase * cityMultiplier), high: Math.round(1800 * colBase * cityMultiplier), unit: 'USD' },
        { name: 'Utilities', low: Math.round(100 * colBase), high: Math.round(220 * colBase), unit: 'USD' },
        { name: 'Groceries (1 person)', low: Math.round(280 * colBase), high: Math.round(450 * colBase), unit: 'USD' },
        { name: 'Gas (per gallon)', low: Math.round(2.8 * colBase * 10) / 10, high: Math.round(4.2 * colBase * 10) / 10, unit: 'USD' },
        { name: 'Restaurant Meal', low: Math.round(12 * colBase * cityMultiplier), high: Math.round(35 * colBase * cityMultiplier), unit: 'USD' },
      ],
    },
    {
      category: 'Activities',
      items: [
        { name: 'Golf (18 holes)', low: Math.round(35 * colBase * cityMultiplier), high: Math.round(150 * colBase * cityMultiplier), unit: 'USD' },
        { name: 'Museum / Attraction', low: Math.round(10 * colBase), high: Math.round(35 * colBase), unit: 'USD' },
        { name: 'Rental Car (daily)', low: Math.round(40 * colBase), high: Math.round(90 * colBase), unit: 'USD' },
      ],
    },
  ];
}

function getRegion(state: string): string {
  const west = ['CA', 'OR', 'WA', 'NV', 'AZ', 'UT', 'CO', 'ID', 'MT', 'WY', 'AK', 'HI'];
  const northeast = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'];
  const south = ['TX', 'FL', 'GA', 'NC', 'SC', 'VA', 'WV', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA', 'OK', 'MD', 'DE', 'DC'];
  if (west.includes(state)) return 'west';
  if (northeast.includes(state)) return 'northeast';
  if (south.includes(state)) return 'south';
  return 'midwest';
}