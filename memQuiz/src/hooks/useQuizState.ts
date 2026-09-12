import { useState, useMemo, useEffect, useRef } from 'react';
import { DataItem, ModuleConfig, QuizItem, QuizField, GenericOutputType } from '../types';
import { getLevenshteinDistance } from '../utils/levenshtein';
import { Settings } from './useSettings';

// Fisher-Yates Shuffle Helper
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const useQuizState = (
    config: ModuleConfig,
    data: DataItem[],
    selectedBatches: number[],
    activeOutputs: Record<string, GenericOutputType>,
    batchSize: number,
    settings: Settings
) => {
    const [currentBatchIdx, setCurrentBatchIdx] = useState(0);
    const [currentItemIdx, setCurrentItemIdx] = useState(0);
    const [fields, setFields] = useState<QuizField[]>([]);
    const [score, setScore] = useState(0);
    const [totalAttempted, setTotalAttempted] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ 1. GATHER ALL SELECTED DATA FIRST
    const allSelectedData = useMemo(() => {
        const allBatches: DataItem[][] = [];
        for (let i = 0; i < data.length; i += batchSize) {
            allBatches.push(data.slice(i, i + batchSize));
        }

        // Flatten only the batches the user actually selected
        const gathered = selectedBatches.map(idx => allBatches[idx]).flat();

        // ✅ 2. SHUFFLE EVERYTHING AT ONCE BEFORE SPLITTING INTO CHUNKS
        return shuffleArray(gathered);
    }, [data, selectedBatches, batchSize]);

    // ✅ 3. SLICE THE ALREADY-SHUFFLED ARRAY INTO BATCHES FOR THE QUIZ FLOW
    const items = useMemo(() => {
        const currentBatchItems = allSelectedData.slice(
            currentBatchIdx * batchSize,
            (currentBatchIdx + 1) * batchSize
        );

        return currentBatchItems.map(item => {
            const promptKey = Object.keys(item).find(
                k => typeof item[k] === 'string' && !Object.keys(activeOutputs).includes(k)
            ) || 'name';

            const fields: QuizField[] = Object.entries(activeOutputs)
                .filter(([outKey]) => item[outKey] !== undefined)
                .map(([outKey, outType]) => {
                    let options: (string | number)[] | undefined;

                    if (outType === 'Options') {
                        const correctVal = item[outKey];
                        const allUniqueValues = [...new Set(data.map(d => d[outKey]))];
                        const distractors = allUniqueValues
                            .filter(v => v !== correctVal)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, settings.optionsCount - 1);
                        options = [correctVal, ...distractors].sort(() => 0.5 - Math.random());
                    }

                    return {
                        outputKey: outKey,
                        outputType: outType,
                        expectedAnswer: item[outKey],
                        userAnswer: '',
                        isFilled: false,
                        options
                    };
                });

            return { id: item.id, promptKey, promptValue: String(item[promptKey]), fields };
        });
    }, [allSelectedData, currentBatchIdx, activeOutputs, config, batchSize, data, settings.optionsCount]);

    const currentItem = items[currentItemIdx];
    const isFinished = currentBatchIdx >= Math.ceil(allSelectedData.length / batchSize);

    useEffect(() => {
        if (currentItem) {
            setFields(currentItem.fields.map(f => ({ ...f, userAnswer: '', isFilled: false })));
            setFeedback(null);
            setShowValidationErrors(false);
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        }
    }, [currentItem]);

    const updateField = (index: number, value: string) => {
        const newFields = [...fields];
        newFields[index].userAnswer = value;
        newFields[index].isFilled = value.trim() !== '';
        setFields(newFields);
        if (showValidationErrors) setShowValidationErrors(false);
    };

    const checkAnswers = () => {
        const allFilled = fields.every(f => f.isFilled);
        if (!allFilled) {
            setShowValidationErrors(true);
            return;
        }

        let allExact = true;

        const evaluatedFields = fields.map(f => {
            let isCorrect = false;
            let isExactMatch = false;

            const userVal = String(f.userAnswer).trim();
            const expectedVal = String(f.expectedAnswer).trim();

            if (f.outputType === 'Text') {
                isExactMatch = userVal.toLowerCase() === expectedVal.toLowerCase();
                isCorrect = isExactMatch;
            }
            else if (f.outputType === 'TextClose') {
                const distance = getLevenshteinDistance(userVal.toLowerCase(), expectedVal.toLowerCase());
                isExactMatch = distance === 0;
                isCorrect = distance <= settings.textCloseDistance;
            }
            else if (f.outputType === 'Number') {
                isExactMatch = parseFloat(userVal) === parseFloat(expectedVal);
                isCorrect = isExactMatch;
            }
            else if (f.outputType === 'NumberClose') {
                const userNum = parseFloat(userVal);
                const expectedNum = parseFloat(expectedVal);

                isExactMatch = userNum === expectedNum;

                if (expectedNum === 0) {
                    isCorrect = userNum === 0;
                } else {
                    const percentOff = Math.abs((userNum - expectedNum) / expectedNum) * 100;
                    isCorrect = percentOff <= settings.numberClosePercent;
                }
            }
            else if (f.outputType === 'Options') {
                isExactMatch = userVal === expectedVal;
                isCorrect = isExactMatch;
            }

            if (!isExactMatch) allExact = false;
            return { ...f, isExact: isExactMatch, isCorrect };
        });

        setFields(evaluatedFields);

        const allAtLeastClose = evaluatedFields.every(f => f.isCorrect);

        if (allAtLeastClose) setScore(s => s + 1);
        setTotalAttempted(t => t + 1);

        const newFeedback = allAtLeastClose ? 'correct' : 'incorrect';
        setFeedback(newFeedback);

        if (allExact && allAtLeastClose) {
            advanceTimerRef.current = setTimeout(() => nextItem(), 500);
        }
    };

    const nextItem = () => {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

        if (currentItemIdx + 1 < items.length) {
            setCurrentItemIdx(prev => prev + 1);
        } else {
            setCurrentBatchIdx(prev => prev + 1);
            setCurrentItemIdx(0);
        }
    };

    useEffect(() => {
        return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
    }, []);

    return {
        currentItem, fields, updateField, feedback,
        checkAnswers, nextItem, score, totalAttempted,
        isFinished, showValidationErrors,
        totalBatches: Math.ceil(allSelectedData.length / batchSize)
    };
};