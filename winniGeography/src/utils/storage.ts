import { ScoreRecord } from '../types';

export const getScore = (townId: string): ScoreRecord | null => {
    const data = localStorage.getItem(`winni_score_${townId}`);
    return data ? JSON.parse(data) : null;
};

export const saveScore = (townId: string, score: ScoreRecord) => {
    const existing = getScore(townId);
    if (!existing || score.bestPercent > existing.bestPercent ||
        (score.bestPercent === existing.bestPercent && score.bestTime < existing.bestTime)) {
        localStorage.setItem(`winni_score_${townId}`, JSON.stringify(score));
    }
};