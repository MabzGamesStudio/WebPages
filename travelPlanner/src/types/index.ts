export interface GeoLocation {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    county?: string;
  };
}

export interface NearbyPlace {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    leisure?: string;
    aeroway?: string;
    sport?: string;
    tourism?: string;
    [key: string]: string | undefined;
  };
  distance?: number;
  type: 'hotel' | 'airport' | 'golf' | 'activity';
}

export interface NearbyPlacesData {
  hotels: NearbyPlace[];
  airports: NearbyPlace[];
  golf: NearbyPlace[];
  activities: NearbyPlace[];
}

export interface WeatherData {
  month: string;
  year: number;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
}

export interface DailyWeather {
  day: string;       // e.g., "Feb 15"
  avgTemp: number;   // 10-year average of daily mean
  maxTemp: number;   // 10-year average of daily max
}

export interface PriceEstimate {
  category: string;
  items: {
    name: string;
    low: number;
    high: number;
    unit: string;
  }[];
}

export interface LocationSummary {
  location: GeoLocation;
  hotels: NearbyPlace[];
  airports: NearbyPlace[];
  golfCourses: NearbyPlace[];
  activities: NearbyPlace[];
  weather: DailyWeather[];
  prices: PriceEstimate[];
}
