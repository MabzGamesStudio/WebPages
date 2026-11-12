import { useCallback, useMemo, useState } from 'react';
import { fetchDailyTemperature, type DailyTempResponse } from '../api/openMeteo';
import { buildDailyDataset, buildMonthlyDataset } from '../utils/climateMath';
import type { CityResult, ClimateDataset, Precision } from '../types/climate';

export function useClimateData() {
  const [rawDaily, setRawDaily] = useState<DailyTempResponse | null>(null);
  const [city, setCity] = useState<CityResult | null>(null);
  const [precision, setPrecision] = useState<Precision>('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataset = useMemo<ClimateDataset | null>(() => {
    if (!rawDaily || !city) return null;
    const builder = precision === 'day' ? buildDailyDataset : buildMonthlyDataset;
    const { points, baselineByMonth } = builder(rawDaily);
    if (points.length === 0) return null;
    return { city, points, baselineByMonth, precision };
  }, [rawDaily, city, precision]);

  const loadCity = useCallback(async (selected: CityResult) => {
    setLoading(true);
    setError(null);
    setRawDaily(null);
    setCity(null);
    try {
      const daily = await fetchDailyTemperature(selected.latitude, selected.longitude);
      // Quick check that there's data
      const hasData = daily.temperature_2m_mean.some((t) => t !== null && t !== undefined);
      if (!hasData) {
        throw new Error('No historical temperature records were returned for this location.');
      }
      setCity(selected);
      setRawDaily(daily);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load climate data');
    } finally {
      setLoading(false);
    }
  }, []);

  const switchPrecision = useCallback((p: Precision) => {
    setPrecision(p);
  }, []);

  const reset = useCallback(() => {
    setRawDaily(null);
    setCity(null);
    setError(null);
  }, []);

  return { dataset, loading, error, precision, loadCity, switchPrecision, reset };
}