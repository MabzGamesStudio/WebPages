// MapView.tsx
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IslandFeature, QuizMode } from '../types';

interface MapViewProps {
    islands: IslandFeature[];
    mode: QuizMode;
    onIslandClick: (id: string) => void;
    showLabels?: boolean;
    lastGuess?: string | null;
    correctAnswer?: string | null;
    isCorrect?: boolean;
    showAnswer?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
    islands,
    mode,
    onIslandClick,
    showLabels = false,
    lastGuess = null,
    correctAnswer = null,
    isCorrect = false,
    showAnswer = false
}) => {
    const geoJsonRef = useRef<L.GeoJSON | null>(null);

    const center: [number, number] = [43.6, -71.3];

    const getStyle = (feature?: IslandFeature) => {
        if (!feature) return {};

        const featureId = feature.properties.id || feature.properties['@id'] || feature.properties.name;
        const featureName = feature.properties.name;
        let fillColor = '#ffffff';
        let fillOpacity = 0.6;
        let weight = 0.5;
        let color = '#888';

        if (mode === 'practice') {
            fillColor = '#3388ff';
            fillOpacity = 0.7;
            weight = 1;
            color = 'white';
        } else if (mode === 'quiz') {
            // Compare by name, not ID
            if (showAnswer && correctAnswer && featureName === correctAnswer) {
                fillColor = '#00ff00';
                fillOpacity = 0.8;
                weight = 3;
                color = '#00ff00';
                console.log('Setting green for correct answer:', featureName);
            } else if (showAnswer && lastGuess && featureId === lastGuess && !isCorrect) {
                fillColor = '#ff0000';
                fillOpacity = 0.8;
                weight = 3;
                color = '#ff0000';
                console.log('Setting red for wrong guess:', featureName);
            }
        }

        return {
            fillColor,
            weight,
            opacity: 1,
            color,
            dashArray: mode === 'practice' ? '3' : undefined,
            fillOpacity
        };
    };

    const onEachFeature = (feature: IslandFeature, layer: L.Layer) => {
        const featureId = feature.properties.id || feature.properties['@id'] || feature.properties.name;
        const displayName = feature.properties.name || 'Unknown Island';

        console.log('OnEachFeature - feature:', displayName, 'ID:', featureId);

        let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

        if (mode === 'practice' && showLabels) {
            layer.on({
                click: (e) => {
                    // Close any existing tooltip
                    if (tooltipTimeout) {
                        clearTimeout(tooltipTimeout);
                        layer.closeTooltip();
                    }

                    // Bind and open tooltip
                    layer.bindTooltip(displayName, {
                        permanent: true,
                        direction: 'center',
                        className: 'island-label',
                        opacity: 0.8
                    }).openTooltip();

                    // Auto close after 5 seconds
                    tooltipTimeout = setTimeout(() => {
                        layer.closeTooltip();
                        tooltipTimeout = null;
                    }, 5000);
                }
            });
        }

        if (mode === 'quiz') {
            layer.on({
                click: (e) => {
                    console.log('=== Map Click Event ===');
                    console.log('Clicked feature:', displayName);
                    console.log('Feature ID:', featureId);
                    console.log('Calling onIslandClick with:', featureId);
                    onIslandClick(featureId);
                }
            });
        }

        layer.on({
            mouseover: (e: L.LeafletMouseEvent) => {
                if (mode === 'practice') {
                    const l = e.target;
                    l.setStyle({
                        weight: 3,
                        color: '#666',
                        fillOpacity: 0.9
                    });
                }
            },
            mouseout: (e: L.LeafletMouseEvent) => {
                if (mode === 'practice') {
                    const l = e.target;
                    l.setStyle(getStyle(feature));
                }
            }
        });
    };

    useEffect(() => {
        console.log('useEffect triggered:', { lastGuess, correctAnswer, isCorrect, showAnswer, mode });
        if (geoJsonRef.current) {
            geoJsonRef.current.eachLayer((layer: any) => {
                if (layer.feature) {
                    const feature = layer.feature as IslandFeature;
                    const newStyle = getStyle(feature);
                    console.log('Applying style to:', feature.properties.name, newStyle);
                    layer.setStyle(newStyle);
                }
            });
        }
    }, [lastGuess, correctAnswer, isCorrect, showAnswer, mode]);

    return (
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
            />
            <GeoJSON
                ref={geoJsonRef}
                key={JSON.stringify(islands) + mode + lastGuess + correctAnswer + showAnswer}
                data={islands as any}
                style={getStyle as any}
                onEachFeature={onEachFeature as any}
            />
        </MapContainer>
    );
};

export default MapView;