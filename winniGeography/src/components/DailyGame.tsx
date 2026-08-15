import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DailyMapView from './DailyMapView';
import { saveDailyScore, getDailyScore } from '../utils/storage';
import geoDataUrl from '../../data/WinnipesaukeeIslands.geojson?url';
import { getDailyIsland, getDailySeed, getDailyDateString } from '../utils/dailySeed';

interface IslandFeature {
    type: 'Feature';
    properties: {
        id: string;
        '@id'?: string;
        alt_name?: string | null;
        ele?: string;
        'gnis:feature_id'?: string;
        leaf_cycle?: string | null;
        leaf_type?: string | null;
        name: string;
        natural?: string | null;
        place?: string;
        type?: string;
        wikidata?: string;
        wikipedia?: string | null;
        town: string;
    };
    geometry: { type: string; coordinates: any };
}

interface GeoJSONData {
    type: 'FeatureCollection';
    name: string;
    crs?: { type: string; properties: { name: string } };
    features: IslandFeature[];
}

interface GuessResult {
    guess: string;
    greenIndices: number[];
    hammingDistance: number;
}

const MAX_GUESSES = 6;

function lcsLength(a: string, b: string): number {
    const m = a.length, n = b.length;
    let prev = new Array(n + 1).fill(0);
    let curr = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1]);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

function multisetIntersectionSize(a: string, b: string): number {
    const counts = new Map<string, number>();
    for (const ch of b) counts.set(ch, (counts.get(ch) || 0) + 1);
    let intersection = 0;
    for (const ch of a) {
        const count = counts.get(ch);
        if (count && count > 0) { intersection++; counts.set(ch, count - 1); }
    }
    return intersection;
}

function getGreenIndices(guess: string, answer: string): number[] {
    const counts = new Map<string, number>();
    for (const ch of answer.toLowerCase()) counts.set(ch, (counts.get(ch) || 0) + 1);
    const greenIndices: number[] = [];
    for (let i = 0; i < guess.length; i++) {
        const ch = guess[i].toLowerCase();
        const count = counts.get(ch);
        if (count && count > 0) { greenIndices.push(i); counts.set(ch, count - 1); }
    }
    return greenIndices;
}

function computeDistance(guess: string, answer: string): number {
    const g = guess.toLowerCase(), a = answer.toLowerCase();
    return g.length + a.length - multisetIntersectionSize(g, a) - lcsLength(g, a);
}

const DailyGame: React.FC = () => {
    const navigate = useNavigate();
    const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
    const [targetIsland, setTargetIsland] = useState<IslandFeature | null>(null);
    const [guesses, setGuesses] = useState<GuessResult[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [copied, setCopied] = useState(false);

    const dailySeed = getDailySeed();

    useEffect(() => {
        fetch(geoDataUrl)
            .then(res => res.json())
            .then((data: GeoJSONData) => {
                setGeoData(data);
                const target = getDailyIsland(data.features);
                setTargetIsland(target);

                // Restore progress on reload
                const saved = getDailyScore(dailySeed);
                if (saved?.guessResults && saved.guessResults.length > 0) {
                    setGuesses(saved.guessResults);
                    const finished = saved.won || saved.guessResults.length >= MAX_GUESSES;
                    setGameOver(finished);
                    setWon(saved.won);
                }
            })
            .catch(err => console.error('Failed to load GeoJSON:', err));
    }, [dailySeed]);

    const namedIslands = useMemo(() => {
        if (!geoData) return [];
        return geoData.features.filter(f => f.properties.name && f.properties.name.trim().length > 0);
    }, [geoData]);

    const generateShareText = useMemo(() => {
        const header = `Lake Winnipesaukee Island Daily ${getDailyDateString()}`;
        const rows = guesses.map(g => {
            const squares = g.guess.split('').map((_, i) => g.greenIndices.includes(i) ? '🟩' : '⬜').join('');
            return `${squares} ${g.hammingDistance}`;
        });
        const result = won ? `🎉 ${guesses.length}/${MAX_GUESSES}` : `❌ X/${MAX_GUESSES}`;
        return [header, '', ...rows, '', result].join('\n');
    }, [guesses, won]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetIsland || gameOver || !currentGuess.trim()) return;

        const guess = currentGuess.trim();
        const answer = targetIsland.properties.name;
        const greenIndices = getGreenIndices(guess, answer);
        const distance = computeDistance(guess, answer);

        const normalizedGuess = guess.toLowerCase().replace(/\s+/g, ' ').trim();
        const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, ' ').trim();
        const isCorrect = normalizedGuess === normalizedAnswer;

        const result: GuessResult = { guess, greenIndices, hammingDistance: distance };
        const newGuesses = [...guesses, result];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (isCorrect) {
            setWon(true);
            setGameOver(true);
            saveDailyScore(dailySeed, { won: true, guesses: newGuesses.length, guessResults: newGuesses });
        } else if (newGuesses.length >= MAX_GUESSES) {
            setGameOver(true);
            saveDailyScore(dailySeed, { won: false, guesses: MAX_GUESSES, guessResults: newGuesses });
        } else {
            // Save mid-game progress so it survives reload
            saveDailyScore(dailySeed, { won: false, guesses: newGuesses.length, guessResults: newGuesses });
        }
    };

    if (!geoData || !targetIsland) {
        return <div className="daily-loading">Loading today's island...</div>;
    }

    return (
        <div className="daily-game">
            <div className="daily-header">
                <button onClick={() => navigate('/')} className="back-btn">← Back</button>
                <h2>Daily Island Challenge</h2>
                <span className="daily-seed">#{dailySeed}</span>
            </div>

            <div className="daily-map-wrapper">
                <DailyMapView islands={namedIslands} targetIsland={targetIsland} />
            </div>

            <div className="daily-guesses">
                {guesses.map((g, idx) => (
                    <div key={`${g.guess}-${idx}`} className="guess-row">
                        <div className="guess-word">
                            {g.guess.split('').map((char, cidx) => (
                                <span key={cidx} className={g.greenIndices.includes(cidx) ? 'char-green' : 'char-gray'}>
                                    {char}
                                </span>
                            ))}
                        </div>
                        <span className="hamming-badge" title="Minimum edits">{g.hammingDistance}</span>
                    </div>
                ))}
            </div>

            {!gameOver && (
                <form onSubmit={handleSubmit} className="guess-form">
                    <input
                        type="text"
                        value={currentGuess}
                        onChange={e => setCurrentGuess(e.target.value)}
                        placeholder="Type island name..."
                        autoComplete="off"
                        autoFocus
                        maxLength={22}
                    />
                    <button type="submit">Guess ({guesses.length}/{MAX_GUESSES})</button>
                </form>
            )}

            {gameOver && (
                <div className={`game-over ${won ? 'won' : ''}`}>
                    {won ? (
                        <h3>🎉 Correct! The island was <strong>{targetIsland.properties.name}</strong></h3>
                    ) : (
                        <h3>📍 The island was <strong>{targetIsland.properties.name}</strong></h3>
                    )}
                    <p>Guesses: {guesses.length} / {MAX_GUESSES}</p>
                    <div className="share-row">
                        <button onClick={handleShare} className="share-btn">
                            {copied ? '✅ Copied!' : '📋 Share Score'}
                        </button>
                    </div>
                    <button onClick={() => navigate('/')}>Back to Menu</button>
                </div>
            )}
        </div>
    );
};

export default DailyGame;