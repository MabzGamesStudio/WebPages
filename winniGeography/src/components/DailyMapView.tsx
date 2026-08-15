import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IslandFeature } from '../types';

interface DailyMapViewProps {
    islands: IslandFeature[];
    targetIsland: IslandFeature;
}

function MapFocuser({ targetIsland }: { targetIsland: IslandFeature }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.geoJSON(targetIsland as any);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15, animate: true });
        }
    }, [map, targetIsland]);
    return null;
}

const DailyMapView: React.FC<DailyMapViewProps> = ({ islands, targetIsland }) => {
    const geoJsonRef = useRef<L.GeoJSON | null>(null);

    // Use a unique identifier to avoid matching empty names
    const getTargetId = (f: IslandFeature) =>
        f.properties.id || f.properties['@id'] || f.properties.name;

    const targetId = getTargetId(targetIsland);

    const getStyle = (feature?: IslandFeature) => {
        if (!feature) return {};
        const isTarget = getTargetId(feature) === targetId;

        if (isTarget) {
            return {
                fillColor: '#2980b9',
                weight: 3,
                opacity: 1,
                color: '#1a5276',
                fillOpacity: 0.9,
            };
        }

        // All other islands: invisible / no highlight
        return {
            fillColor: 'transparent',
            weight: 0,
            opacity: 0,
            color: 'transparent',
            fillOpacity: 0,
        };
    };

    return (
        <MapContainer
            center={[43.6, -71.3]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            dragging={false}
            touchZoom={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            boxZoom={false}
            keyboard={false}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
            />
            <MapFocuser targetIsland={targetIsland} />
            <GeoJSON
                ref={geoJsonRef}
                data={islands as any}
                style={getStyle as any}
            />
        </MapContainer>
    );
};

export default DailyMapView;