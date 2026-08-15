import React from 'react';
import { Link } from 'react-router-dom';
import { getScore, getDailyScore } from '../utils/storage';   // ← EDIT
import { getDailySeed } from '../utils/dailySeed';             // ← ADD

// Ensure these match the "town" property in your GeoJSON
export const TOWNS = [
    'Alton',
    'Center Harbor',
    'Gilford',
    'Laconia',
    'Meredith',
    'Moultonborough',
    'Tuftonboro',
    'Wolfeboro',
    'All'
];

const MainMenu: React.FC = () => {
    const dailySeed = getDailySeed();
    const dailyScore = getDailyScore(dailySeed);

    return (
        <div className="main-menu">
            <h1>Lake Winnipesaukee Island Quiz</h1>

            <           div className="daily-section">
                <Link to="/daily" className="town-card daily-card">
                    <h2>🌅 Daily Challenge</h2>
                    {dailyScore ? (
                        <p>{dailyScore.won ? `✅ Solved in ${dailyScore.guesses}` : '❌ Missed today'}</p>
                    ) : (
                        <p>Guess today's island</p>
                    )}
                </Link>
            </div>

            <div className="town-grid">
                {TOWNS.map(town => {
                    const score = getScore(town);
                    return (
                        <Link to={`/quiz/${town}`} key={town} className="town-card">
                            <h2>{town}</h2>
                            {score ? (
                                <p>
                                    Best: {score.bestPercent}% | Time: {score.bestTime}s
                                </p>
                            ) : (
                                <p>No record yet</p>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MainMenu;