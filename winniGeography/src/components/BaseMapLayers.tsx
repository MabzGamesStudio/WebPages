// BaseMapLayers.tsx
// Renders offline vector base map (no external tiles needed)
import React, { useMemo } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapVector from '../../data/mapVector.geojson';

interface BaseMapLayersProps {
    variant: 'dark' | 'light';
}

// Color palettes
const PALETTES = {
    dark: {
        background: '#1a1a2e',
        water: '#0f3460',
        river: '#16213e',
        forest: '#1a3a1a',
        residential: '#222244',
        road: '#445566',
        roadOutline: '#2a3a4a',
    },
    light: {
        background: '#c6dce4',
        water: '#7ec8e3',
        river: '#5fa8d3',
        forest: '#b5d99c',
        residential: '#e8e0d4',
        road: '#ffffff',
        roadOutline: '#cccccc',
    },
} as const;

// Layer ordering: background → forest → residential → water → river → roads
const LAYER_ORDER = ['forest', 'residential', 'water', 'river', 'road'];

const BaseMapLayers: React.FC<BaseMapLayersProps> = ({ variant }) => {
    const map = useMap();
    const palette = PALETTES[variant];

    // Set map background color
    const container = map.getContainer();
    if (container.style.backgroundColor !== palette.background) {
        container.style.backgroundColor = palette.background;
    }

    const featuresByKind = useMemo(() => {
        const grouped: Record<string, any[]> = {
            forest: [],
            residential: [],
            water: [],
            river: [],
            road: [],
        };
        if (!mapVector || !mapVector.features) return grouped;
        for (const f of mapVector.features) {
            const kind = f.properties?.kind;
            if (kind && grouped[kind]) {
                grouped[kind].push(f);
            }
        }
        return grouped;
    }, []);

    const styleFn = (kind: string) => (feature?: any) => {
        if (!feature) return {};
        const hw = feature.properties?.highway;

        switch (kind) {
            case 'water':
                return {
                    fillColor: palette.water,
                    fillOpacity: 1,
                    weight: 0,
                    color: palette.water,
                    opacity: 0,
                };
            case 'river':
                return {
                    fillColor: palette.river,
                    fillOpacity: 0,
                    weight: 2.5,
                    color: palette.river,
                    opacity: 0.9,
                };
            case 'forest':
                return {
                    fillColor: palette.forest,
                    fillOpacity: 0.6,
                    weight: 0,
                    color: palette.forest,
                    opacity: 0,
                };
            case 'residential':
                return {
                    fillColor: palette.residential,
                    fillOpacity: 0.5,
                    weight: 0.5,
                    color: palette.residential,
                    opacity: 0.5,
                };
            case 'road': {
                const major = hw === 'motorway' || hw === 'trunk';
                return {
                    fillColor: palette.road,
                    fillOpacity: 0,
                    weight: major ? 2.5 : 1.2,
                    color: palette.road,
                    opacity: 0.7,
                };
            }
            default:
                return {};
        }
    };

    return (
        <>
            {LAYER_ORDER.map((kind) => {
                const feats = featuresByKind[kind];
                if (!feats || feats.length === 0) return null;
                const collection = {
                    type: 'FeatureCollection' as const,
                    features: feats,
                };
                return (
                    <GeoJSON
                        key={`basemap-${kind}`}
                        data={collection as any}
                        style={styleFn(kind) as any}
                        interactive={false}
                    />
                );
            })}
        </>
    );
};

export default BaseMapLayers;