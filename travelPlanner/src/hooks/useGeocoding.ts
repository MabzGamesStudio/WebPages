import { useState, useCallback } from 'react'
import { searchLocations } from '@/utils/api'
import type { GeoLocation } from '@/types'

export function useGeocoding() {
  const [results, setResults] = useState<GeoLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await searchLocations(query)
      setResults(data)
    } catch {
      setError('Failed to search locations')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, search }
}
