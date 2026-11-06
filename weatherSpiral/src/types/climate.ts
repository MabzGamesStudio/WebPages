export interface CityResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface MonthlyPoint {
  year: number;
  month: number; // 1-12
  index: number; // chronological index across the whole dataset
  meanTemp: number; // deg C
  anomaly: number; // deg C, relative to calendar-month baseline
}

export interface ClimateDataset {
  city: CityResult;
  baselineByMonth: number[]; // 12 values, one per calendar month
  points: MonthlyPoint[];
}
