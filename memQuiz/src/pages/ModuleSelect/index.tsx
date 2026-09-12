import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import modulesData from '../../data/modules.json';
import { ModuleConfig, GenericOutputType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import TopBar from '../../components/layout/TopBar';
import styles from './ModuleSelect.module.scss';

const ModuleSelect = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const config = (modulesData as ModuleConfig[]).find(m => m.id === moduleId);
    const { settings } = useSettings();

    const [dataLength, setDataLength] = useState(0);
    const [selectedBatches, setSelectedBatches] = useState<number[]>([]);
    // activeOutputs is now a map of key -> selected type
    const [activeOutputs, setActiveOutputs] = useState<Record<string, GenericOutputType>>({});

    useEffect(() => {
        if (config) {
            import(`../../data/${config.dataFile}`).then((mod: any) => {
                setDataLength(mod.default.length);
                setSelectedBatches([0]);

                // Initialize activeOutputs based on defaultOutputs
                const initialOutputs: Record<string, GenericOutputType> = {};
                Object.entries(config.availableOutputTypes).forEach(([key, types]) => {
                    if (config.defaultOutputs.includes(key)) {
                        initialOutputs[key] = types[0]; // Select first type as default
                    }
                });
                setActiveOutputs(initialOutputs);
            });
        }
    }, [config]);

    if (!config) return <p>Module not found.</p>;

    const totalBatches = Math.ceil(dataLength / settings.batchSize);

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

    // Inside ModuleSelect component, update startQuiz:
    const startQuiz = () => {
        // activeOutputs is already Record<string, GenericOutputType> from useState
        sessionStorage.setItem('quizConfig', JSON.stringify({
            selectedBatches,
            activeOutputs  // ✅ This is now correctly typed as Record<string, GenericOutputType>
        }));
        navigate(`/play/${moduleId}`);
    };

    return (
        <div>
            <TopBar title={config.name} showBack={true} />

            <div className="card">
                <h2>1. Select Batches</h2>
                <p>Total items: {dataLength} | Batch size: {settings.batchSize}</p>
                <div className={styles['batch-grid']}>
                    {Array.from({ length: totalBatches }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`btn ${selectedBatches.includes(idx) ? 'btn--primary' : 'btn--secondary'}`}
                            onClick={() => toggleBatch(idx)}
                        >
                            Batch {idx + 1}
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
                                {types.map(type => (
                                    <button
                                        key={type}
                                        className={`btn ${activeOutputs[key] === type ? 'btn--primary' : 'btn--secondary'}`}
                                        onClick={() => selectOutputType(key, activeOutputs[key] === type ? null : type)}
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
        </div>
    );
};

export default ModuleSelect;