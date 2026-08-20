import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import MapView from '@/components/MapView/MapView'
import WeatherChart from '@/components/WeatherChart/WeatherChart'
import NearbyList from '@/components/NearbyList/NearbyList'
import { useNearbyPlaces } from '@/hooks/useNearbyPlaces'
import styles from './LocationDetail.module.scss'

export default function LocationDetail() {
    const { lat, lon } = useParams<{ lat: string; lon: string }>()
    const [searchParams] = useSearchParams()
    const displayName = searchParams.get('name') || 'Unknown Location'

    const latitude = parseFloat(lat || '0')
    const longitude = parseFloat(lon || '0')

    const { data: nearby, loading: nearbyLoading } = useNearbyPlaces(latitude, longitude)

    const allPlaces = [
        ...nearby.hotels,
        ...nearby.airports,
        ...nearby.golf,
        ...nearby.activities,
    ]

    return (
        <div className={styles.detail}>
            <Link to="/" className={styles.backLink}>
                <ArrowLeft size={18} />
                Back to Search
            </Link>

            <div className={styles.titleRow}>
                <MapPin size={24} className={styles.pinIcon} />
                <h1>{displayName.split(',')[0]}</h1>
            </div>
            <p className={styles.subtitle}>{displayName}</p>

            <div className={styles.grid}>
                <div className={styles.mainColumn}>
                    <MapView lat={latitude} lon={longitude} places={allPlaces} zoom={12} />
                    <WeatherChart lat={latitude} lon={longitude} />
                </div>

                <div className={styles.sideColumn}>
                    <NearbyList title="Hotels Nearby" icon="hotel" places={nearby.hotels} loading={nearbyLoading} />
                    <NearbyList title="Airports" icon="airport" places={nearby.airports} loading={nearbyLoading} />
                    <NearbyList title="Golf Courses" icon="golf" places={nearby.golf} loading={nearbyLoading} />
                    <NearbyList title="Activities & Attractions" icon="activity" places={nearby.activities} loading={nearbyLoading} />
                </div>
            </div>
        </div>
    )
}