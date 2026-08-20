import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { useGeocoding } from '@/hooks/useGeocoding'
import type { GeoLocation } from '@/types'
import styles from './SearchBar.module.scss'

interface SearchBarProps {
  onSelect: (location: GeoLocation) => void
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { results, loading, search } = useGeocoding()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query)
        setOpen(true)
      } else {
        setOpen(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (loc: GeoLocation) => {
    setQuery(loc.display_name)
    setOpen(false)
    onSelect(loc)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <Search size={18} className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for a US city, town, or address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className={styles.input}
        />
        {loading && <Loader2 size={18} className={styles.spinner} />}
      </div>

      {open && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((loc) => (
            <li key={loc.place_id} className={styles.item} onClick={() => handleSelect(loc)}>
              <MapPin size={16} />
              <div className={styles.itemText}>
                <span className={styles.itemName}>{loc.name}</span>
                <span className={styles.itemSub}>{loc.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className={styles.dropdown}>
          <div className={styles.noResults}>No locations found</div>
        </div>
      )}
    </div>
  )
}
