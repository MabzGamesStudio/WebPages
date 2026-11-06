import { useState } from 'react';
import { useGeocoding } from '../../hooks/useGeocoding';
import type { CityResult } from '../../types/climate';
import styles from './CitySearch.module.scss';

interface CitySearchProps {
  onSelect: (city: CityResult) => void;
}

export default function CitySearch({ onSelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, loading, error } = useGeocoding(query);

  const handleSelect = (city: CityResult) => {
    setQuery(`${city.name}, ${city.country}`);
    setOpen(false);
    onSelect(city);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className={styles.input}
          type="text"
          placeholder="Search a city&hellip;"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>

      {open && query.trim() && (
        <div className={styles.results}>
          {loading && <div className={styles.status}>Searching&hellip;</div>}
          {error && <div className={styles.status}>{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className={styles.status}>No matching cities</div>
          )}
          {!loading &&
            results.map((city) => (
              <button
                key={city.id}
                type="button"
                className={styles.resultItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(city)}
              >
                <span className={styles.resultName}>
                  {city.name}
                  {city.admin1 ? `, ${city.admin1}` : ''}
                </span>
                <span className={styles.resultMeta}>
                  {city.country} · {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
