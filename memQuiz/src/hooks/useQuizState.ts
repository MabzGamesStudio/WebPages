import { useState, useMemo, useEffect, useRef } from 'react';
import { DataItem, ModuleConfig, QuizItem, QuizField, GenericOutputType } from '../types';
import { getLevenshteinDistance } from '../utils/levenshtein';
import { Settings } from './useSettings';

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

    const specialType = Object.values(activeOutputs).find(
        type => type === 'Digits' || type === 'Sequence' || type === 'LongText' || type === 'LongTextClose'
    ) || null;

    const isSpecial = !!specialType;

    const allGatheredItems = useMemo(() => {
        if (specialType) {
            const items: QuizItem[] = [];

            if (specialType === 'Digits') {
                const item = data[0];
                const digitsStr = String(item.digits || item.value || item.name || '');
                const promptStr = item.name !== digitsStr ? String(item.name) : config.name;
                const outKey = Object.keys(activeOutputs).find(k => activeOutputs[k] === 'Digits') || 'digits';

                for (let i = 0; i < digitsStr.length; i += settings.batchDigits) {
                    const chunk = digitsStr.slice(i, i + settings.batchDigits);
                    items.push({
                        id: `digits-${i}`,
                        promptKey: 'name',
                        promptValue: promptStr,
                        fields: [{
                            outputKey: outKey,
                            outputType: 'Digits',
                            expectedAnswer: chunk,
                            userAnswer: '',
                            isFilled: false,
                            isExact: false,
                            isCorrect: false
                        }]
                    });
                }
                return selectedBatches.map(idx => items[idx]).filter(Boolean) as QuizItem[];
            }

            if (specialType === 'Sequence') {
                const outKey = Object.keys(activeOutputs).find(k => activeOutputs[k] === 'Sequence') || 'name';
                const promptStr = config.name;

                const allItems: QuizItem[] = data.map((item, index) => ({
                    id: `sequence-${index}`,
                    promptKey: 'name',
                    promptValue: `${promptStr} (Item ${index + 1})`,
                    fields: [{
                        outputKey: outKey,
                        outputType: 'Sequence',
                        expectedAnswer: String(item.name || item.value || item),
                        userAnswer: '',
                        isFilled: false,
                        isExact: false,
                        isCorrect: false
                    }]
                }));

                const gathered: QuizItem[] = [];
                selectedBatches.forEach(batchIdx => {
                    const start = batchIdx * settings.batchSequence;
                    const end = start + settings.batchSequence;
                    gathered.push(...allItems.slice(start, end));
                });

                return gathered;
            }

            if (specialType === 'LongText' || specialType === 'LongTextClose') {
                const item = data[0];
                const longText = String(item.text || item.value || item.name || '');
                const promptStr = item.name !== longText ? String(item.name) : config.name;
                const outKey = Object.keys(activeOutputs).find(k => activeOutputs[k] === specialType) || 'text';

                const words = longText.split(/\s+/).filter(w => w.length > 0);
                for (let i = 0; i < words.length; i += settings.batchLongText) {
                    const chunkWords = words.slice(i, i + settings.batchLongText);
                    const chunkText = chunkWords.join(' ');

                    const hint = chunkWords.map(w => {
                        const firstLetter = w.match(/[a-zA-Z0-9]/)?.[0] || '';
                        const punct = w.match(/[.,!?;:"()]/g)?.join('') || '';
                        return firstLetter + punct;
                    }).join(' ');

                    items.push({
                        id: `longtext-${i}`,
                        promptKey: 'hint',
                        promptValue: hint,
                        fields: [{
                            outputKey: outKey,
                            outputType: specialType,
                            expectedAnswer: chunkText,
                            userAnswer: '',
                            isFilled: false,
                            isExact: false,
                            isCorrect: false
                        }]
                    });
                }
                return selectedBatches.map(idx => items[idx]).filter(Boolean) as QuizItem[];
            }

            return [] as QuizItem[];
        }

        // Standard behavior
        const allBatches: DataItem[][] = [];
        for (let i = 0; i < data.length; i += batchSize) {
            allBatches.push(data.slice(i, i + batchSize));
        }
        const gathered = selectedBatches.map(idx => allBatches[idx]).flat();
        return shuffleArray(gathered);
    }, [data, selectedBatches, batchSize, activeOutputs, settings, config.name, specialType]);

    const totalSpecialBatches = useMemo(() => {
        if (!isSpecial) return Math.ceil((allGatheredItems as DataItem[]).length / batchSize);

        if (specialType === 'Sequence') {
            return Math.ceil((allGatheredItems as QuizItem[]).length / settings.batchSequence);
        }

        // For Digits and LongText, each gathered item is one quiz batch
        return (allGatheredItems as QuizItem[]).length;
    }, [isSpecial, allGatheredItems, batchSize, specialType, settings.batchSequence]);

    const items = useMemo(() => {
        if (isSpecial) {
            let chunkSize = 1;
            if (specialType === 'Sequence') {
                chunkSize = settings.batchSequence;
            }

            const startIdx = currentBatchIdx * chunkSize;
            const endIdx = startIdx + chunkSize;
            return (allGatheredItems as QuizItem[]).slice(startIdx, endIdx);
        }

        const currentBatchData = (allGatheredItems as DataItem[]).slice(
            currentBatchIdx * batchSize,
            (currentBatchIdx + 1) * batchSize
        );

        return currentBatchData.map(item => {
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
                        options,
                        isExact: false,
                        isCorrect: false
                    };
                });

            return { id: item.id, promptKey, promptValue: String(item[promptKey]), fields };
        });
    }, [allGatheredItems, currentBatchIdx, activeOutputs, config, batchSize, data, settings.optionsCount, isSpecial, specialType, settings.batchSequence]);

    const currentItem = items[currentItemIdx];
    const isFinished = currentBatchIdx >= totalSpecialBatches;

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

        const digitsField = fields.find(f => f.outputType === 'Digits');
        if (digitsField) {
            const expectedLength = String(digitsField.expectedAnswer).length;
            const userLength = String(digitsField.userAnswer).length;

            if (userLength !== expectedLength) {
                setShowValidationErrors(true);
                return;
            }
        }

        let allExact = true;
        let allAtLeastClose = true;

        const evaluatedFields = fields.map(f => {
            let isCorrect = false;
            let isExactMatch = false;

            const userVal = String(f.userAnswer).trim();
            const expectedVal = String(f.expectedAnswer).trim();

            if (f.outputType === 'Text' || f.outputType === 'Digits' || f.outputType === 'Sequence' || f.outputType === 'LongText') {
                isExactMatch = userVal.toLowerCase() === expectedVal.toLowerCase();
                isCorrect = isExactMatch;
            }
            else if (f.outputType === 'TextClose') {
                const distance = getLevenshteinDistance(userVal.toLowerCase(), expectedVal.toLowerCase());
                isExactMatch = distance === 0;
                isCorrect = distance <= settings.textCloseDistance;
            }
            else if (f.outputType === 'LongTextClose') {
                const userWords = userVal.split(/\s+/).filter(w => w.length > 0);
                const expectedWords = expectedVal.split(/\s+/).filter(w => w.length > 0);

                // If the total number of words doesn't match, it's immediately incorrect
                if (userWords.length !== expectedWords.length) {
                    isExactMatch = false;
                    isCorrect = false;
                } else {
                    let allWordsClose = true;
                    let allWordsExact = true;

                    // Check every single word individually
                    for (let i = 0; i < expectedWords.length; i++) {
                        const uw = userWords[i].toLowerCase();
                        const ew = expectedWords[i].toLowerCase();
                        const distance = getLevenshteinDistance(uw, ew);

                        if (distance > 0) allWordsExact = false;

                        // If even ONE word exceeds the allowed distance, the whole batch fails
                        if (distance > settings.textCloseDistance) {
                            allWordsClose = false;
                            break;
                        }
                    }

                    isExactMatch = allWordsExact;
                    isCorrect = allWordsClose;
                }
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
            if (!isCorrect) allAtLeastClose = false;
            return { ...f, isExact: isExactMatch, isCorrect };
        });

        setFields(evaluatedFields);

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
        totalBatches: totalSpecialBatches
    };
};