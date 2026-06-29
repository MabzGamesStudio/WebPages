// QuizGame.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapView from './MapView';
import { saveScore } from '../utils/storage';
import { QuizMode } from '../types';
import geoDataUrl from '../../data/WinnipesaukeeIslands.geojson?url';

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
    geometry: {
        type: string;
        coordinates: any;
    };
}

interface GeoJSONData {
    type: 'FeatureCollection';
    name: string;
    crs?: {
        type: string;
        properties: {
            name: string;
        };
    };
    features: IslandFeature[];
}

const QuizGame: React.FC = () => {
    const { townId } = useParams<{ townId: string }>();
    const navigate = useNavigate();
    const [mode, setMode] = useState<QuizMode>('practice');
    const [islandsToGuess, setIslandsToGuess] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [lastGuess, setLastGuess] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        fetch(geoDataUrl)
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error('Failed to load GeoJSON:', err));
    }, []);

    const townIslands = useMemo(() => {
        if (!geoData || !geoData.features) return [];
        return geoData.features.filter((f) =>
            townId === 'All' || f.properties.town === townId
        );
    }, [geoData, townId]);

    const islandNames = useMemo(() =>
        townIslands.map((f) => f.properties.name).filter(Boolean),
        [townIslands]
    );

    const startQuiz = () => {
        const shuffled = [...islandNames].sort(() => Math.random() - 0.5);
        setIslandsToGuess(shuffled);
        setCurrentIndex(0);
        setCorrectCount(0);
        setStartTime(Date.now());
        setIsFinished(false);
        setShowAnswer(false);
        setLastGuess(null);
        setIsCorrect(false);
        setMode('quiz');
    };

    const handleContinue = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= islandsToGuess.length) {
            setIsFinished(true);
            const timeTaken = Math.floor((Date.now() - (startTime || 0)) / 1000);
            const percent = Math.round((correctCount / islandsToGuess.length) * 100);

            console.log('Quiz finished!', {
                correctCount,
                total: islandsToGuess.length,
                percent
            });

            if (townId) {
                saveScore(townId, { bestPercent: percent, bestTime: timeTaken });
            }
        } else {
            setCurrentIndex(nextIndex);
            setShowAnswer(false);
            setLastGuess(null);
            setIsCorrect(false);
        }
    };

    const handleIslandClick = (islandId: string) => {
        const clickedIsland = townIslands.find(f =>
            f.properties.id === islandId ||
            f.properties['@id'] === islandId ||
            f.properties.name === islandId
        );
        const clickedName = clickedIsland?.properties.name || islandId;

        if (mode !== 'quiz' || isFinished || showAnswer || !islandsToGuess[currentIndex]) return;

        const correct = clickedName === islandsToGuess[currentIndex];
        const newCorrectCount = correct ? correctCount + 1 : correctCount;

        setCorrectCount(newCorrectCount);
        setLastGuess(islandId);
        setIsCorrect(correct);
        setShowAnswer(true);

        if (correct) {
            // Store the new count in a variable that won't change
            const finalCorrectCount = newCorrectCount;
            setTimeout(() => {
                // Use the stored value
                const nextIndex = currentIndex + 1;
                if (nextIndex >= islandsToGuess.length) {
                    const timeTaken = Math.floor((Date.now() - (startTime || 0)) / 1000);
                    const percent = Math.round((finalCorrectCount / islandsToGuess.length) * 100);

                    if (townId) {
                        saveScore(townId, { bestPercent: percent, bestTime: timeTaken });
                    }
                    setIsFinished(true);
                } else {
                    setCurrentIndex(nextIndex);
                    setShowAnswer(false);
                    setLastGuess(null);
                    setIsCorrect(false);
                }
            }, 1000);
        }
    };

    if (!geoData) {
        return <div>Loading map data...</div>;
    }

    if (townIslands.length === 0) {
        return <div>No islands found for this town. Check your GeoJSON properties.</div>;
    }

    return (
        <div className="quiz-container">
            <div className="quiz-header">
                <button onClick={() => navigate('/')} className="back-btn">← Back</button>
                <h2>{townId} Islands</h2>

                <div className="mode-controls">
                    <button
                        className={mode === 'practice' ? 'active' : ''}
                        onClick={() => setMode('practice')}
                    >
                        Practice
                    </button>
                    <button
                        className={mode === 'quiz' ? 'active' : ''}
                        onClick={startQuiz}
                    >
                        Start Quiz
                    </button>
                </div>
            </div>

            {mode === 'quiz' && !isFinished && !(!isCorrect && showAnswer) && (
                <div className="prompt-bar">
                    <h3>Find: <span className="target-island">{islandsToGuess[currentIndex]}</span></h3>
                    <p>Island {currentIndex + 1} of {islandsToGuess.length}</p>
                </div>
            )}

            {isFinished && (
                <div className="prompt-bar finished">
                    <h3>Quiz Complete!</h3>
                    <p>Score: {correctCount} / {islandsToGuess.length}</p>
                    <button onClick={startQuiz}>Try Again</button>
                </div>
            )}

            {showAnswer && !isFinished && !isCorrect && (
                <div className="prompt-bar answer">
                    <h3>❌ Incorrect answer for: <span className="target-island">{islandsToGuess[currentIndex]}</span></h3>
                    <button onClick={handleContinue}>Continue</button>
                </div>
            )}

            <div className="map-wrapper">
                <MapView
                    islands={townIslands}
                    mode={mode}
                    onIslandClick={handleIslandClick}
                    showLabels={mode === 'practice'}
                    lastGuess={lastGuess}
                    correctAnswer={showAnswer ? islandsToGuess[currentIndex] : null}
                    isCorrect={isCorrect}
                    showAnswer={showAnswer}
                />
            </div>
        </div>
    );
};

export default QuizGame;