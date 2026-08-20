import { useState, useEffect } from 'react'
import { getNearbyPlaces } from '@/utils/api'
import type { NearbyPlace } from '@/types'

export function useNearbyPlaces(lat: number, lon: number) {
  const [data, setData] = useState<{
    hotels: NearbyPlace[]
    airports: NearbyPlace[]
    golf: NearbyPlace[]
    activities: NearbyPlace[]
  }>({ hotels: [], airports: [], golf: [], activities: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getNearbyPlaces(lat, lon)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load nearby places')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [lat, lon])

  return { data, loading, error }
}
