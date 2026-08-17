import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import QuizGame from './components/QuizGame';
import DailyGame from './components/DailyGame';
import DailyTapGame from './components/DailyTapGame';

const App: React.FC = () => {
    return (
        <HashRouter>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path="/quiz/:townId" element={<QuizGame />} />
                    <Route path="/daily" element={<DailyGame />} />
                    <Route path="/daily-tap" element={<DailyTapGame />} />
                </Routes>
            </div>
        </HashRouter>
    );
};

export default App;