import type { CityResult } from '../types/climate';

// Open-Meteo is a free weather API that requires no API key for
// non-commercial use. Geocoding finds a lat/lon for a place name, and the
// archive endpoint returns daily historical observations (ERA5 reanalysis)
// for that location going back to 1940.
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

interface GeocodingApiResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export async function searchCities(query: string): Promise<CityResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=10&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`City search failed (${res.status})`);
  }
  const data: { results?: GeocodingApiResult[] } = await res.json();
  if (!data.results) return [];

  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export interface DailyTempResponse {
  time: string[];
  temperature_2m_mean: Array<number | null>;
}

export async function fetchDailyTemperature(
  latitude: number,
  longitude: number,
  startDate = '1950-01-01',
  endDate?: string
): Promise<DailyTempResponse> {
  const end = endDate ?? new Date().toISOString().slice(0, 10);
  const url =
    `${ARCHIVE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&start_date=${startDate}&end_date=${end}` +
    `&daily=temperature_2m_mean&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Climate data request failed (${res.status})`);
  }
  const data: { daily: DailyTempResponse } = await res.json();
  return data.daily;
}
