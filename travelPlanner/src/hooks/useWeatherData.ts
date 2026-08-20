import { useState, useEffect } from 'react'
import { getHistoricalWeather } from '@/utils/api'
import type { DailyWeather } from '@/types'

export function useWeatherData(lat: number, lon: number) {
  const [data, setData] = useState<DailyWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getHistoricalWeather(lat, lon)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load weather data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [lat, lon])

  return { data, loading, error }
}
