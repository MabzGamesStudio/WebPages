import { useWeatherData } from '@/hooks/useWeatherData'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Thermometer, Loader2 } from 'lucide-react'
import styles from './WeatherChart.module.scss'

interface WeatherChartProps {
  lat: number
  lon: number
}

export default function WeatherChart({ lat, lon }: WeatherChartProps) {
  const { data, loading, error } = useWeatherData(lat, lon)

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Thermometer size={20} />
          <h3>Daily Temperature (Feb–Apr, 10-Year Avg)</h3>
        </div>
        <div className={styles.loading}>
          <Loader2 size={24} className={styles.spinner} />
          <span>Loading historical weather data...</span>
        </div>
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Thermometer size={20} />
          <h3>Daily Temperature (Feb–Apr, 10-Year Avg)</h3>
        </div>
        <div className={styles.error}>{error || 'No weather data available'}</div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Thermometer size={20} />
        <h3>Daily Temperature (Feb–Apr, 10-Year Avg)</h3>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f8cff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f8cff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="day"
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              // With ~90 days, showing every 10th label keeps it clean
              interval={9}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              unit="°F"
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
              }}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />

            <Area
              type="monotone"
              dataKey="maxTemp"
              name="10-Yr Avg High"
              stroke="#f87171"
              fill="url(#colorMax)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="avgTemp"
              name="10-Yr Avg Daily"
              stroke="#4f8cff"
              fill="url(#colorAvg)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legendNote}>
        Based on daily averages and maximums from February–April (2015–2024)
      </div>
    </div>
  )
}