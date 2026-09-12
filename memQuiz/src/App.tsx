import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ModuleSelect from './pages/ModuleSelect';
import QuizPlay from './pages/QuizPlay';
import Settings from './pages/Settings'; // ✅ NEW
import './styles/global.scss';

function App() {
    return (
        <HashRouter>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/module/:moduleId" element={<ModuleSelect />} />
                    <Route path="/play/:moduleId" element={<QuizPlay />} />
                    <Route path="/settings" element={<Settings />} /> {/* ✅ NEW */}
                </Routes>
            </div>
        </HashRouter>
    );
}

export default App;