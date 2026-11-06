import { useEffect, useRef, useState } from 'react';
import { searchCities } from '../api/openMeteo';
import type { CityResult } from '../types/climate';

export function useGeocoding(query: string) {
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const cities = await searchCities(trimmed);
        if (requestId === requestIdRef.current) {
          setResults(cities);
        }
      } catch (e) {
        if (requestId === requestIdRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to search cities');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { results, loading, error };
}
