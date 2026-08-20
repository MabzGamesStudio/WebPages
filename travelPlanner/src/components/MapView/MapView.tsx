import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import type { NearbyPlace } from '@/types'
import styles from './MapView.module.scss'

const COLORS: Record<string, string> = {
  main: 'blue',
  hotel: 'red',
  airport: 'gold',
  golf: 'violet',
  activity: 'orange',
}

function makeIcon(color: string, size: 'lg' | 'sm' = 'sm'): Icon {
  const px = size === 'lg' ? '2x' : ''
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon${px ? '-' + px : ''}-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: size === 'lg' ? [25, 41] : [20, 33],
    iconAnchor: size === 'lg' ? [12, 41] : [10, 33],
    popupAnchor: size === 'lg' ? [1, -34] : [1, -28],
    shadowSize: [41, 41],
  })
}

const mainIcon = makeIcon(COLORS.main, 'lg')
const hotelIcon = makeIcon(COLORS.hotel)
const airportIcon = makeIcon(COLORS.airport)
const golfIcon = makeIcon(COLORS.golf)
const activityIcon = makeIcon(COLORS.activity)

function getIconForPlace(place: NearbyPlace): Icon {
  switch (place.type) {
    case 'hotel': return hotelIcon
    case 'airport': return airportIcon
    case 'golf': return golfIcon
    case 'activity': return activityIcon
    default: return activityIcon
  }
}

function getLabelForPlace(place: NearbyPlace): string {
  const name = place.tags.name || 'Unnamed'
  const subtype = place.tags.amenity || place.tags.leisure || place.tags.tourism || place.tags.aeroway || place.type
  const dist = place.distance !== undefined ? ` — ${place.distance < 1 ? '<1' : place.distance} km` : ''
  return `<strong>${name}</strong><br/>${subtype}${dist}`
}

interface MapViewProps {
  lat: number
  lon: number
  places?: NearbyPlace[]
  zoom?: number
}

export default function MapView({ lat, lon, places = [], zoom = 13 }: MapViewProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Map</h3>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.gmapsLink}>
          View on Google Maps
        </a>
      </div>
      <div className={styles.mapContainer}>
        <MapContainer center={[lat, lon]} zoom={zoom} scrollWheelZoom={false} className={styles.map}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]} icon={mainIcon}>
            <Popup>Selected Location</Popup>
          </Marker>
          {places.map((place) => (
            <Marker key={place.id} position={[place.lat, place.lon]} icon={getIconForPlace(place)}>
              <Popup>
                <div dangerouslySetInnerHTML={{ __html: getLabelForPlace(place) }} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className={styles.legend}>
        <span><span className={styles.dot} style={{ background: '#2a81cb' }} /> Location</span>
        <span><span className={styles.dot} style={{ background: '#cb2b3e' }} /> Hotels</span>
        <span><span className={styles.dot} style={{ background: '#ffd700' }} /> Airports</span>
        <span><span className={styles.dot} style={{ background: '#9c2bcb' }} /> Golf</span>
        <span><span className={styles.dot} style={{ background: '#cb8427' }} /> Activities</span>
      </div>
    </div>
  )
}