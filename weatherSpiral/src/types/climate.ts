export interface CityResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export type Precision = 'month' | 'day';

export interface ClimatePoint {
  year: number;
  month: number; // 1-12
  day?: number;  // 1-31, present only in daily mode
  index: number; // chronological index across the whole dataset
  meanTemp: number; // deg C
  anomaly: number; // deg C, relative to calendar-month baseline
}

/** Backward alias */
export type MonthlyPoint = ClimatePoint;

export interface ClimateDataset {
  city: CityResult;
  baselineByMonth: number[]; // 12 values, one per calendar month
  points: ClimatePoint[];
  precision: Precision;
}