import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDailyTapSeed, getDailyTapIslands, getDailyDateString } from '../utils/dailySeed';
import { saveDailyTapScore, getDailyTapScore } from '../utils/storage';
import geoDataUrl from '../../data/WinnipesaukeeIslands.geojson?url';

interface IslandFeature {
    type: 'Feature';
    properties: {
        id: string;
        name: string;
        [key: string]: any;
    };
    geometry: { type: string; coordinates: any };
}

const BASE_POINTS = 100;
const DISTANCE_FACTOR = 0.0002; // ⚙️ CONFIGURE THIS: Higher = points drop off faster. (0.005 means ~50% points at 200m)

interface RoundResult {
    rawPoints: number;      // Points before round multiplier
    finalPoints: number;    // Points after round multiplier
    distance: number;
    roundMultiplier: number;// 1, 2, or 3
    emoji: string;
}

// --- Helper Functions ---
function getCentroid(feature: IslandFeature) {
    const coords = feature.geometry.coordinates;
    let latSum = 0, lngSum = 0, count = 0;

    const processRing = (ring: any[]) => {
        for (const pt of ring) {
            lngSum += pt[0];
            latSum += pt[1];
            count++;
        }
    };

    if (feature.geometry.type === 'Polygon') {
        processRing(coords[0]);
    } else if (feature.geometry.type === 'MultiPolygon') {
        for (const poly of coords) {
            processRing(poly[0]);
        }
    } else if (feature.geometry.type === 'Point') {
        return { lat: coords[1], lng: coords[0] };
    }

    return count > 0 ? { lat: latSum / count, lng: lngSum / count } : { lat: 43.6, lng: -71.3 };
}

function getMaxRadius(feature: IslandFeature): number {
    const coords = feature.geometry.coordinates;
    const centroid = getCentroid(feature);
    let count = 0;
    let maxDistance = 0;

    const processRing = (ring: any[]) => {
        for (const pt of ring) {
            maxDistance = Math.max(maxDistance, getDistanceInMeters(centroid.lat, centroid.lng, pt[1], pt[0]));
            count++;
        }
    };

    if (feature.geometry.type === 'Polygon') {
        processRing(coords[0]);
    } else if (feature.geometry.type === 'MultiPolygon') {
        for (const poly of coords) {
            processRing(poly[0]);
        }
    }

    // Fallback to 50m if geometry is just a point or malformed
    return count > 0 ? maxDistance : 50;
}

function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const POINT_EMOJIS = [
    '❌', // 0-4 pts
    '🤢', // 5-9 pts
    '😵‍💫', // 10-14 pts
    '🔭', // 15-19 pts
    '😬', // 20-24 pts
    '💀', // 25-29 pts
    '😕', // 30-34 pts
    '😐', // 35-39 pts
    '😲', // 40-44 pts
    '😊', // 45-49 pts
    '🤔', // 50-54 pts
    '🤠', // 55-59 pts
    '💡', // 60-64 pts
    '👀', // 65-69 pts
    '🧠', // 70-74 pts
    '💪', // 75-79 pts
    '🔥', // 80-84 pts
    '😎', // 85-89 pts
    '🌟', // 90-94 pts
    '📌', // 95-99 pts
    '🎯'  // 100 pts
];

function calculatePoints(distance: number, avgRadius: number, round: number): RoundResult {
    // Distance from the edge of the island (0 if the guess is inside the island)
    const effectiveDistance = Math.max(0, distance - avgRadius);

    // Continuous multiplier based on distance from the edge
    const distanceMultiplier = 1 / (1 + (effectiveDistance * DISTANCE_FACTOR));
    const rawPoints = Math.round(BASE_POINTS * distanceMultiplier);

    // Round multiplier (x1 for Round 1, x2 for Round 2, x3 for Round 3)
    const roundMultiplier = round + 1;
    const finalPoints = rawPoints * roundMultiplier;

    const emojiIndex = Math.min(20, Math.floor(rawPoints / 5));
    const emoji = POINT_EMOJIS[emojiIndex];

    return { rawPoints, finalPoints, distance, roundMultiplier, emoji };
}

const guessIcon = L.divIcon({
    className: 'guess-marker',
    html: '<div style="background-color: #e74c3c; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const MapClickHandler = ({ onMapClick }: { onMapClick: (e: any) => void }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e);
        },
    });
    return null;
};

const DailyTapGame: React.FC = () => {
    const navigate = useNavigate();
    const dailySeed = getDailyTapSeed();

    const [geoData, setGeoData] = useState<any>(null);
    const [roundIslands, setRoundIslands] = useState<IslandFeature[]>([]);
    const [round, setRound] = useState(0);
    const [guessLatLng, setGuessLatLng] = useState<L.LatLng | null>(null);
    const [showNextButton, setShowNextButton] = useState(false);
    const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch(geoDataUrl)
            .then(res => res.json())
            .then((data: any) => {
                setGeoData(data);
                const islands = getDailyTapIslands(data.features, dailySeed);
                setRoundIslands(islands);

                const saved = getDailyTapScore(dailySeed);
                if (saved) {
                    setRoundResults(saved.results);
                    setGameOver(true);
                }
            })
            .catch(err => console.error('Failed to load GeoJSON:', err));
    }, [dailySeed]);

    const targetIsland = roundIslands[round];

    const handleMapClick = (e: any) => {
        // 👇 Changed 'revealed' to 'showNextButton'
        if (!showNextButton && !gameOver) {
            setGuessLatLng(e.latlng);
        }
    };

    const handleConfirm = () => {
        if (!guessLatLng || !targetIsland || showNextButton) return;

        const centroid = getCentroid(targetIsland);
        const distance = getDistanceInMeters(guessLatLng.lat, guessLatLng.lng, centroid.lat, centroid.lng);

        // 👇 Calculate avgRadius and pass it to calculatePoints
        const avgRadius = getMaxRadius(targetIsland);
        const result = calculatePoints(distance, avgRadius, round);

        const newResults = [...roundResults, result];
        setRoundResults(newResults);
        setShowNextButton(true);
    };

    const handleNext = () => {
        if (round < 2) {
            setRound(r => r + 1);
            setGuessLatLng(null);
            setShowNextButton(false); // Reset for next round
        } else {
            setGameOver(true);
            const totalPoints = roundResults.reduce((sum, r) => sum + r.finalPoints, 0);
            saveDailyTapScore(dailySeed, {
                totalPoints,
                results: roundResults,
                date: getDailyDateString()
            });
        }
    };

    const generateShareText = useMemo(() => {
        const totalPoints = roundResults.reduce((sum, r) => sum + r.finalPoints, 0);
        const rows = roundResults.map((r, i) => {
            return `${r.emoji} ${r.finalPoints}`;
        });
        return [
            `Lake Winnipesaukee Island Tap 🗺️`,
            `${getDailyDateString()}`,
            rows.join(' '),
            `Total: ${totalPoints}`
        ].join('\n');
    }, [roundResults]);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(generateShareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = generateShareText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!geoData || roundIslands.length === 0) {
        return <div className="daily-loading">Loading today's islands...</div>;
    }

    if (gameOver) {
        // 👇 Changed 'r.points' to 'r.finalPoints'
        const totalPoints = roundResults.reduce((sum, r) => sum + r.finalPoints, 0);
        return (
            <div className="daily-tap-game">
                <div className="tap-header">
                    <button onClick={() => navigate('/')} className="back-btn">← Back</button>
                    <h2>Island Tap Complete!</h2>
                </div>
                <div className="game-over-screen">
                    <h3>Total Score: <strong>{totalPoints} / 900 pts</strong></h3>
                    <div className="share-text">{generateShareText}</div>
                    <button onClick={handleShare} className="share-btn">
                        {copied ? '✅ Copied!' : '📋 Share Score'}
                    </button>
                    <button onClick={() => navigate('/')} className="back-btn" style={{ marginTop: '1rem' }}>
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    const centroid = targetIsland ? getCentroid(targetIsland) : null;
    const currentResult = roundResults[round];

    return (
        <div className="daily-tap-game">
            <div className="tap-header">
                <button onClick={() => navigate('/')} className="back-btn">← Back</button>
                <h2>Island Tap: Round {round + 1}/3</h2>
                <span className="daily-seed">#{dailySeed}</span>
            </div>

            <div className="tap-map-wrapper">
                <MapContainer
                    center={[43.6, -71.3]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                >
                    {/* Listen for clicks on the map */}
                    <MapClickHandler onMapClick={handleMapClick} />

                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap contributors, &copy; CARTO'
                    />

                    {targetIsland && (
                        <>
                            <GeoJSON
                                data={targetIsland as any}
                                style={{
                                    fillColor: showNextButton ? '#2ecc71' : 'transparent', // Changed from 'revealed'
                                    weight: showNextButton ? 2 : 0,
                                    opacity: showNextButton ? 1 : 0,
                                    color: showNextButton ? '#27ae60' : 'transparent',
                                    fillOpacity: showNextButton ? 0.4 : 0,
                                }}
                            />
                            {showNextButton && centroid && targetIsland && (
                                <>
                                    {(() => {
                                        // Calculate the exact radii based on the DISTANCE_FACTOR
                                        // Math: points = 100 / (1 + d * factor)  =>  d = ((100 / points) - 1) / factor
                                        const d100 = getMaxRadius(targetIsland);
                                        const d80 = ((100 / 80) - 1) / DISTANCE_FACTOR;
                                        const d60 = ((100 / 60) - 1) / DISTANCE_FACTOR;
                                        const d40 = ((100 / 40) - 1) / DISTANCE_FACTOR;

                                        return (
                                            <>
                                                {/* 100 Point Circle (The Island's Average Boundary) */}
                                                <Circle
                                                    center={centroid}
                                                    radius={d100}
                                                    pathOptions={{ color: '#2ecc71', fillColor: '#2ecc71', fillOpacity: 0.15, weight: 2, dashArray: '4, 4' }}
                                                />
                                                {/* 80 Point Circle */}
                                                <Circle
                                                    center={centroid}
                                                    radius={d100 + d80}
                                                    pathOptions={{ color: '#f1c40f', fillColor: '#f1c40f', fillOpacity: 0.08, weight: 2 }}
                                                />
                                                {/* 60 Point Circle */}
                                                <Circle
                                                    center={centroid}
                                                    radius={d100 + d60}
                                                    pathOptions={{ color: '#e67e22', fillColor: '#e67e22', fillOpacity: 0.08, weight: 2 }}
                                                />
                                                {/* 40 Point Circle */}
                                                <Circle
                                                    center={centroid}
                                                    radius={d100 + d40}
                                                    pathOptions={{ color: '#e61111', fillColor: '#e61111', fillOpacity: 0.08, weight: 2 }}
                                                />
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </>
                    )}

                    {guessLatLng && <Marker position={guessLatLng} icon={guessIcon} />}
                </MapContainer>

            </div>

            <div className="tap-controls">
                <h3 className="target-name">Find: {targetIsland.properties.name}</h3>

                {!showNextButton ? (
                    <>
                        <p>{guessLatLng ? 'Guess placed! Click confirm to lock it in.' : 'Click anywhere on the map to place your guess.'}</p>
                        <button
                            className="confirm-btn"
                            onClick={handleConfirm}
                            disabled={!guessLatLng}
                        >
                            Confirm Guess
                        </button>
                    </>
                ) : (
                    <>
                        <p className="result-text">
                            {roundResults[round].emoji} You scored <strong>{roundResults[round].finalPoints}</strong> points!
                            <br />
                            <small>(Distance: {Math.round(roundResults[round].distance)}m | Base: {roundResults[round].rawPoints} × {roundResults[round].roundMultiplier})</small>
                        </p>
                        <button className="confirm-btn next-btn" onClick={handleNext}>
                            {round < 2 ? 'Next Round →' : 'Finish Game 🏁'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DailyTapGame;