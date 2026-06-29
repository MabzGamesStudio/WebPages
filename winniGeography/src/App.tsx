import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import QuizGame from './components/QuizGame';

const App: React.FC = () => {
    return (
        <HashRouter>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path="/quiz/:townId" element={<QuizGame />} />
                </Routes>
            </div>
        </HashRouter>
    );
};

export default App;