import type { NearbyPlace } from '@/types'
import { Hotel, Plane, Flag, MapPin, Loader2 } from 'lucide-react'
import styles from './NearbyList.module.scss'

interface NearbyListProps {
  title: string
  icon: 'hotel' | 'airport' | 'golf' | 'activity'
  places: NearbyPlace[]
  loading?: boolean
}

const iconMap = {
  hotel: <Hotel size={18} />,
  airport: <Plane size={18} />,
  golf: <Flag size={18} />,
  activity: <MapPin size={18} />,
}

const colorMap = {
  hotel: '#4f8cff',
  airport: '#fbbf24',
  golf: '#a78bfa',
  activity: '#f87171',
}

export default function NearbyList({ title, icon, places, loading }: NearbyListProps) {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header} style={{ color: colorMap[icon] }}>
          {iconMap[icon]}
          <h4>{title}</h4>
        </div>
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spinner} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header} style={{ color: colorMap[icon] }}>
        {iconMap[icon]}
        <h4>{title}</h4>
        <span className={styles.count}>{places.length}</span>
      </div>
      {places.length === 0 ? (
        <div className={styles.empty}>None found nearby</div>
      ) : (
        <ul className={styles.list}>
          {places.slice(0, 8).map((place) => (
            <li key={place.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{place.tags.name || 'Unnamed'}</span>
                <span className={styles.itemType}>
                  {place.tags.amenity || place.tags.leisure || place.tags.tourism || place.tags.aeroway || place.type}
                </span>
              </div>
              {place.distance !== undefined && (
                <span className={styles.distance}>{place.distance < 1 ? '<1' : place.distance} km</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
