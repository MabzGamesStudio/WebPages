import React from 'react';
import { Link } from 'react-router-dom';
import { getScore } from '../utils/storage';

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
    return (
        <div className="main-menu">
            <h1>Lake Winnipesaukee Island Quiz</h1>
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