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
        console.log('Quiz started! Islands to guess:', shuffled);
    };

    const handleContinue = () => {
        const nextIndex = currentIndex + 1;
        console.log('handleContinue called, nextIndex:', nextIndex);
        if (nextIndex >= islandsToGuess.length) {
            setIsFinished(true);
            const timeTaken = Math.floor((Date.now() - (startTime || 0)) / 1000);
            const percent = Math.round((correctCount / islandsToGuess.length) * 100);

            if (townId) {
                saveScore(townId, { bestPercent: percent, bestTime: timeTaken });
            }
        } else {
            setCurrentIndex(nextIndex);
            setShowAnswer(false);
            setLastGuess(null);
            setIsCorrect(false);
            console.log('Moving to next island, new index:', nextIndex);
        }
    };

    const handleIslandClick = (islandId: string) => {
        console.log('=== Island Clicked ===');
        console.log('islandId from click:', islandId);
        console.log('Current island to guess:', islandsToGuess[currentIndex]);
        console.log('Current index:', currentIndex);
        console.log('Mode:', mode);
        console.log('isFinished:', isFinished);
        console.log('showAnswer:', showAnswer);

        const clickedIsland = townIslands.find(f => {
            const match = f.properties.id === islandId ||
                f.properties['@id'] === islandId ||
                f.properties.name === islandId;
            if (match) {
                console.log('Found matching island:', f.properties.name);
            }
            return match;
        });

        const clickedName = clickedIsland?.properties.name || islandId;
        console.log('Clicked island name:', clickedName);
        console.log('Comparing:', clickedName, '===', islandsToGuess[currentIndex]);

        if (mode !== 'quiz' || isFinished || showAnswer || !islandsToGuess[currentIndex]) {
            console.log('Returning early - conditions not met');
            return;
        }

        const correct = clickedName === islandsToGuess[currentIndex];
        console.log('Is correct?', correct);

        setLastGuess(islandId);
        setIsCorrect(correct);
        setShowAnswer(true);
        console.log('State updated - lastGuess:', islandId, 'isCorrect:', correct, 'showAnswer:', true);

        if (correct) {
            console.log('Correct answer! Incrementing count');
            setCorrectCount(prev => prev + 1);
            setTimeout(() => {
                console.log('Timeout - calling handleContinue for correct answer');
                handleContinue();
            }, 1000);
        } else {
            console.log('Incorrect answer - waiting for user to click continue');
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