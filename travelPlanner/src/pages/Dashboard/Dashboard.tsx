import { useNavigate } from 'react-router-dom'
import SearchBar from '@/components/SearchBar/SearchBar'
import type { GeoLocation } from '@/types'
import styles from './Dashboard.module.scss'

export default function Dashboard() {
    const navigate = useNavigate()

    const handleSelect = (loc: GeoLocation) => {
        navigate(`/location/${loc.lat}/${loc.lon}?name=${encodeURIComponent(loc.display_name)}`)
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.hero}>
                <h1>Explore Your Next Destination</h1>
                <p>Search any US location to see hotels, airports, golf courses, weather history, and cost estimates.</p>
                <SearchBar onSelect={handleSelect} />
            </div>

            <div className={styles.features}>
                <div className={styles.featureCard}>
                    <h3>🗺️ Interactive Map</h3>
                    <p>View locations on OpenStreetMap with a direct link to Google Maps.</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>🌡️ Historical Weather</h3>
                    <p>See 10-year average daily temperatures for February through April.</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>💰 Price Estimates</h3>
                    <p>Get estimated flight costs from Boston, NYC, and Bradley, plus hotel and living costs.</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>📍 Nearby Places</h3>
                    <p>Find hotels, airports, golf courses, and attractions within range.</p>
                </div>
            </div>
        </div>
    )
}