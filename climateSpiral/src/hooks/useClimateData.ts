import { useCallback, useState } from 'react';
import { fetchDailyTemperature } from '../api/openMeteo';
import { buildMonthlyDataset } from '../utils/climateMath';
import type { CityResult, ClimateDataset } from '../types/climate';

export function useClimateData() {
  const [dataset, setDataset] = useState<ClimateDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCity = useCallback(async (city: CityResult) => {
    setLoading(true);
    setError(null);
    setDataset(null);
    try {
      const daily = await fetchDailyTemperature(city.latitude, city.longitude);
      const { points, baselineByMonth } = buildMonthlyDataset(daily);
      if (points.length === 0) {
        throw new Error('No historical temperature records were returned for this location.');
      }
      setDataset({ city, points, baselineByMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load climate data');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDataset(null);
    setError(null);
  }, []);

  return { dataset, loading, error, loadCity, reset };
}
