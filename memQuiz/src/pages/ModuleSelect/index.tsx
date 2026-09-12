import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import modulesData from '../../data/modules.json';
import { GenericOutputType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import TopBar from '../../components/layout/TopBar';
import styles from './ModuleSelect.module.scss';

interface QuizHistoryEntry {
    moduleId: string;
    activeOutputs: Record<string, string>;
    batchSize: number;
    score: number;
    totalAttempted: number;
    date: string;
    selectedBatches: number[];
}

interface RecentSetting {
    activeOutputs: Record<string, GenericOutputType>;
    selectedBatches: number[];
    batchSize: number;
    date: string;
}

const ModuleSelect = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const config = (modulesData as any[]).find(m => m.id === moduleId);
    const { settings, updateSettings } = useSettings();

    const [dataLength, setDataLength] = useState(0);
    const [moduleData, setModuleData] = useState<any[]>([]);
    const [selectedBatches, setSelectedBatches] = useState<number[]>([]);
    const [activeOutputs, setActiveOutputs] = useState<Record<string, GenericOutputType>>({});

    const [recentSettings, setRecentSettings] = useState<RecentSetting[]>([]);
    const [bestScores, setBestScores] = useState<QuizHistoryEntry[]>([]);

    useEffect(() => {
        if (config) {
            import(`../../data/${config.dataFile}`).then((mod: any) => {
                const d = mod.default;
                setModuleData(d);
                setDataLength(d.length);

                // 1. Check for recent settings for this module
                const storedRecent = localStorage.getItem(`memquiz_recent_${moduleId}`);

                if (storedRecent) {
                    const parsedRecent: RecentSetting[] = JSON.parse(storedRecent);
                    setRecentSettings(parsedRecent);

                    if (parsedRecent.length > 0) {
                        const mostRecent = parsedRecent[0];

                        // Apply saved settings
                        setActiveOutputs(mostRecent.activeOutputs);
                        setSelectedBatches(mostRecent.selectedBatches);
                        updateSettings({ batchSize: mostRecent.batchSize });
                    } else {
                        // Fallback to defaults if array is empty
                        setSelectedBatches([0]);
                        initializeDefaultOutputs();
                    }
                } else {
                    // Fallback to defaults if no history exists
                    setSelectedBatches([0]);
                    initializeDefaultOutputs();
                }
            });
        }
    }, [config, moduleId]);

    const initializeDefaultOutputs = () => {
        if (!config) return;

        const initialOutputs: Record<string, GenericOutputType> = {};

        // ✅ Explicitly type the entries to avoid implicit any errors
        Object.entries(config.availableOutputTypes).forEach(([key, types]: [string, any]) => {
            if (config!.defaultOutputs.includes(key)) {
                // Ensure we only assign if types exists and has items
                if (Array.isArray(types) && types.length > 0) {
                    initialOutputs[key] = types[0];
                }
            }
        });
        setActiveOutputs(initialOutputs);
    };

    // Load recent settings and calculate best scores for current configuration
    useEffect(() => {
        if (!moduleId) return;

        const storedRecent = localStorage.getItem(`memquiz_recent_${moduleId}`);
        if (storedRecent) {
            setRecentSettings(JSON.parse(storedRecent));
        }

        const storedHistory = localStorage.getItem(`memquiz_history_${moduleId}`);
        if (storedHistory) {
            const history: QuizHistoryEntry[] = JSON.parse(storedHistory);

            // Create a consistent string key for the current settings to filter matching scores
            const currentConfig = JSON.stringify({
                activeOutputs: Object.entries(activeOutputs).sort((a, b) => a[0].localeCompare(b[0])),
                batchSize: settings.batchSize
            });

            const matchingScores = history.filter(h => {
                const hConfig = JSON.stringify({
                    activeOutputs: Object.entries(h.activeOutputs).sort((a, b) => a[0].localeCompare(b[0])),
                    batchSize: h.batchSize
                });
                return hConfig === currentConfig;
            });

            // Sort by score (desc), then efficiency (totalAttempted asc), then date (desc)
            const sorted = matchingScores.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.totalAttempted !== b.totalAttempted) return a.totalAttempted - b.totalAttempted;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setBestScores(sorted.slice(0, 10));
        }
    }, [moduleId, activeOutputs, settings.batchSize]);

    if (!config) return <p>Module not found.</p>;

    const specialType = Object.values(activeOutputs).find(
        type => type === 'Digits' || type === 'Sequence' || type === 'LongText' || type === 'LongTextClose'
    );

    let totalBatches = Math.ceil(dataLength / settings.batchSize);
    if (specialType && moduleData.length > 0) {
        if (specialType === 'Digits') {
            const item = moduleData[0];
            const digitsStr = String(item.digits || item.value || item.name || '');
            totalBatches = Math.ceil(digitsStr.length / settings.batchDigits);
        } else if (specialType === 'Sequence') {
            totalBatches = Math.ceil(moduleData.length / settings.batchSequence);
        } else if (specialType === 'LongText' || specialType === 'LongTextClose') {
            const item = moduleData[0];
            const longText = String(item.text || item.value || item.name || '');
            const words = longText.split(/\s+/).filter((w: string) => w.length > 0);
            totalBatches = Math.ceil(words.length / settings.batchLongText);
        }
    }

    const toggleBatch = (idx: number) => {
        setSelectedBatches(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const selectOutputType = (key: string, type: GenericOutputType | null) => {
        setActiveOutputs(prev => {
            const next = { ...prev };
            if (type === null) {
                delete next[key];
            } else {
                next[key] = type;
            }
            return next;
        });
    };

    const saveRecentSetting = () => {
        const newSetting: RecentSetting = {
            activeOutputs,
            selectedBatches,
            batchSize: settings.batchSize,
            date: new Date().toISOString()
        };

        // Deduplicate and keep only the 10 most recent
        const updated = [newSetting, ...recentSettings.filter(s =>
            JSON.stringify(s.activeOutputs) !== JSON.stringify(newSetting.activeOutputs) ||
            s.batchSize !== newSetting.batchSize
        )].slice(0, 10);

        setRecentSettings(updated);
        localStorage.setItem(`memquiz_recent_${moduleId}`, JSON.stringify(updated));
    };

    const loadSetting = (setting: RecentSetting) => {
        setActiveOutputs(setting.activeOutputs);
        setSelectedBatches(setting.selectedBatches && setting.selectedBatches.length > 0 ? setting.selectedBatches : [0]);
        updateSettings({ batchSize: setting.batchSize });
    };

    const startQuiz = () => {
        saveRecentSetting();
        sessionStorage.setItem('quizConfig', JSON.stringify({
            selectedBatches,
            activeOutputs
        }));
        navigate(`/play/${moduleId}`);
    };

    return (
        <div>
            <TopBar title={config.name} showBack={true} />

            <div className="card">
                <h2>1. Select Batches</h2>
                <p>Total items: {dataLength} | Effective batches: {totalBatches}</p>
                <div className={styles['batch-grid']}>
                    {Array.from({ length: totalBatches }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`btn ${selectedBatches.includes(idx) ? 'btn--primary' : 'btn--secondary'}`}
                            onClick={() => toggleBatch(idx)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <h2>2. Select Output Depth</h2>
                <div className={styles['depth-list']}>
                    {Object.entries(config.availableOutputTypes).map(([key, types]) => (
                        <div key={key} className={styles['depth-row']}>
                            <span className={styles['depth-label']}>{key}</span>
                            <div className={styles['depth-options']}>
                                {/* ✅ Cast types as string[] so .map knows what 'type' is */}
                                {(types as string[]).map((type: string) => (
                                    <button
                                        key={type}
                                        className={`btn ${activeOutputs[key] === type ? 'btn--primary' : 'btn--secondary'}`}
                                        onClick={() => selectOutputType(key, activeOutputs[key] === type ? null : type as GenericOutputType)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className={`btn btn--primary ${styles['start-btn']}`}
                onClick={startQuiz}
                disabled={selectedBatches.length === 0 || Object.keys(activeOutputs).length === 0}
            >
                Start Quiz
            </button>

            <div className={styles['stats-container']}>
                <div className={styles['stats-column']}>
                    <h3>🏆 Top 10 Scores (Current Settings)</h3>
                    {bestScores.length === 0 ? (
                        <p className={styles['empty-state']}>No scores yet for this configuration.</p>
                    ) : (
                        bestScores.map((entry, idx) => (
                            <div key={idx} className={styles['stat-item']}>
                                <div className={styles['stat-header']}>
                                    <span>Score: {entry.score} / {entry.totalAttempted}</span>
                                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                                </div>
                                {/* ✅ FIXED: Safe access with fallback */}
                                <div className={styles['stat-details']}>
                                    Batches: {(entry.selectedBatches || []).map(b => b + 1).join(', ')}
                                </div>
                                <div className={styles['stat-details']}>
                                    Accuracy: {Math.round((entry.score / entry.totalAttempted) * 100)}%
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles['stats-column']}>
                    <h3>🕒 Recent Configurations</h3>
                    {recentSettings.length === 0 ? (
                        <p className={styles['empty-state']}>No recent configurations.</p>
                    ) : (
                        recentSettings.map((setting, idx) => (
                            <div key={idx} className={styles['stat-item']}>
                                <div className={styles['stat-header']}>
                                    <span>Batch Size: {setting.batchSize}</span>
                                    <span>{new Date(setting.date).toLocaleDateString()}</span>
                                </div>
                                <div className={styles['stat-details']}>
                                    Outputs: {Object.entries(setting.activeOutputs).map(([k, v]) => `${k} (${v})`).join(', ')}
                                </div>
                                {/* ✅ FIXED: Safe access with fallback */}
                                <div className={styles['stat-details']}>
                                    Batches: {(setting.selectedBatches || []).map(b => b + 1).join(', ')}
                                </div>
                                <button
                                    className={`btn btn--secondary ${styles['load-btn']}`}
                                    onClick={() => loadSetting(setting)}
                                >
                                    Load Configuration
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModuleSelect;