import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import modulesData from '../../data/modules.json';
import { ModuleConfig, DataItem, GenericOutputType } from '../../types';
import { useQuizState } from '../../hooks/useQuizState';
import { useSettings } from '../../hooks/useSettings';
import TopBar from '../../components/layout/TopBar';
import InputStack from '../../components/quiz/InputStack';
import styles from './QuizPlay.module.scss';

const QuizPlay = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const config = (modulesData as ModuleConfig[]).find(m => m.id === moduleId);
    const { settings } = useSettings();

    const [data, setData] = useState<DataItem[]>([]);
    const [sessionConfig, setSessionConfig] = useState<{ selectedBatches: number[], activeOutputs: string[] } | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('quizConfig');
        if (stored) setSessionConfig(JSON.parse(stored));

        if (config) {
            import(`../../data/${config.dataFile}`).then((mod: any) => setData(mod.default));
        }
    }, [config]);

    if (!config || !sessionConfig || data.length === 0) return <p>Loading...</p>;

    const { selectedBatches, activeOutputs } = sessionConfig;

    return (
        <QuizEngine
            config={config}
            data={data}
            selectedBatches={selectedBatches}
            activeOutputs={activeOutputs}
            batchSize={settings.batchSize}
            onExit={() => navigate('/')}
        />
    );
};

interface EngineProps {
    config: ModuleConfig;
    data: DataItem[];
    selectedBatches: number[];
    activeOutputs: string[];
    batchSize: number;
    onExit: () => void;
}

const QuizEngine: React.FC<EngineProps> = ({ config, data, selectedBatches, activeOutputs, batchSize, onExit }) => {
    const { settings } = useSettings();

    const normalizeActiveOutputs = (outputs: any): Record<string, GenericOutputType> => {
        if (!outputs || typeof outputs !== 'object') return {};

        // If it's already the correct Record format, return as-is
        if (!Array.isArray(outputs)) return outputs as Record<string, GenericOutputType>;

        // Legacy string[] format - map each key to its first available output type
        const normalized: Record<string, GenericOutputType> = {};
        outputs.forEach((key: string) => {
            const types = config.availableOutputTypes[key];
            if (types && types.length > 0) {
                normalized[key] = types[0];
            }
        });
        return normalized;
    };

    const safeActiveOutputs = normalizeActiveOutputs(activeOutputs);

    const {
        currentItem, fields, updateField, feedback,
        checkAnswers, nextItem, score, totalAttempted, isFinished, showValidationErrors
    } = useQuizState(config, data, selectedBatches, safeActiveOutputs, batchSize, settings);

    useEffect(() => {
        if (isFinished && totalAttempted > 0 && config.id) {
            const historyEntry = {
                moduleId: config.id,
                activeOutputs: safeActiveOutputs,
                batchSize: settings.batchSize,
                score,
                totalAttempted,
                selectedBatches: selectedBatches || [], // ✅ Ensure it's never undefined
                date: new Date().toISOString()
            };

            const storedHistory = localStorage.getItem(`memquiz_history_${config.id}`);
            const history = storedHistory ? JSON.parse(storedHistory) : [];
            history.push(historyEntry);

            localStorage.setItem(`memquiz_history_${config.id}`, JSON.stringify(history.slice(-100)));
        }
    }, [isFinished, config.id, score, totalAttempted, safeActiveOutputs, settings.batchSize, selectedBatches]);


    const inputStackRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (feedback === null && inputStackRef.current) {
            const firstInput = inputStackRef.current.querySelector('input') as HTMLInputElement;
            firstInput?.focus();
        }
    }, [currentItem, feedback]);

    // Handle "Enter" key submission
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (feedback === null) {
            checkAnswers();
        }
    };

    if (isFinished) {
        return (
            <div>
                <TopBar title="Results" />
                <div className={`card ${styles['result-card']}`}>
                    <h2>Batch Complete!</h2>
                    <p className={styles.score}>Score: {score} / {totalAttempted}</p>
                    <button className="btn btn--primary" onClick={onExit}>Back to Home</button>
                </div>
            </div>
        );
    }

    if (!currentItem) return <p>No questions generated for this selection.</p>;

    return (
        <div>
            <TopBar title={`${config.name} - Quiz`} />

            <div className={styles['quiz-container']}>
                <div className={styles['quiz-header']}>
                    <span>Score: {score}/{totalAttempted}</span>
                    <button className="btn btn--secondary" onClick={onExit}>Exit</button>
                </div>

                {/* Form handles the "Enter" key automatically */}
                <form onSubmit={handleSubmit}>
                    <div className={`card ${styles['question-card']}`}>
                        <p className={styles['prompt-label']}>
                            Fill in the details for:
                        </p>
                        <h2 className={styles['prompt-value']}>{currentItem.promptValue}</h2>

                        <InputStack
                            ref={inputStackRef}
                            fields={fields}
                            onUpdate={updateField}
                            disabled={feedback !== null}
                            showErrors={showValidationErrors}
                            inputType={config.inputType}
                            feedback={feedback} // ✅ Pass the missing prop
                        />


                        <div className={styles['action-area']}>
                            {feedback === null ? (
                                <button type="submit" className="btn btn--primary">
                                    Submit Answers
                                </button>
                            ) : feedback === 'incorrect' ? (
                                // ❌ COMPLETELY WRONG: Red panel, no score, must click Next
                                <div className={`${styles.feedback} ${styles.incorrect}`}>
                                    <p>❌ Incorrect.</p>
                                    <div className={styles['correct-answers']}>
                                        {fields.map(f => (
                                            <p key={f.outputKey}>
                                                <strong>{f.outputKey}:</strong> {String(f.expectedAnswer)}
                                            </p>
                                        ))}
                                    </div>
                                    <button type="button" className="btn btn--secondary" onClick={nextItem}>
                                        Next Item →
                                    </button>
                                </div>
                            ) : !fields.every(f => f.isExact) ? (
                                // ⚠️ CLOSE BUT NOT EXACT: Yellow panel, SCORED, must click Next
                                <div className={`${styles.feedback} ${styles.close}`}>
                                    <p>⚠️ Close!</p>
                                    <div className={styles['correct-answers']}>
                                        {fields.filter(f => !f.isExact).map(f => (
                                            <p key={f.outputKey}>
                                                <strong>{f.outputKey}:</strong> {String(f.expectedAnswer)}
                                                <span className={styles['your-answer']}> (You: {f.userAnswer})</span>
                                            </p>
                                        ))}
                                    </div>
                                    <button type="button" className="btn btn--secondary" onClick={nextItem}>
                                        Next Item →
                                    </button>
                                </div>
                            ) : (
                                // ✅ PERFECT: Green flash, auto-advances, no button needed
                                <div className={`${styles.feedback} ${styles.perfect}`}>
                                    <p>✅ Perfect!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuizPlay;