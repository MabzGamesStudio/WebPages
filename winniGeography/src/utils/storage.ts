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
export interface DailyGuessResult {
    guess: string;
    greenIndices: number[];
    hammingDistance: number;
}

export interface DailyScore {
    seed: number;
    won: boolean;
    guesses: number;
    guessResults?: DailyGuessResult[];
    date: string;
}

export function saveDailyScore(seed: number, result: { won: boolean; guesses: number; guessResults?: DailyGuessResult[] }): void {
    try {
        const key = 'daily_scores';
        const scores: DailyScore[] = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = scores.findIndex(s => s.seed === seed);
        const entry: DailyScore = { seed, ...result, date: new Date().toISOString() };
        if (idx >= 0) scores[idx] = entry;
        else scores.push(entry);
        localStorage.setItem(key, JSON.stringify(scores));
    } catch { /* ignore */ }
}

export function getDailyScore(seed: number): DailyScore | null {
    try {
        const scores: DailyScore[] = JSON.parse(localStorage.getItem('daily_scores') || '[]');
        return scores.find(s => s.seed === seed) || null;
    } catch { return null; }
}

// Add to utils/storage.ts

export function saveDailyTapScore(seed: string, scoreData: any) {
    localStorage.setItem(`daily-tap-score-${seed}`, JSON.stringify(scoreData));
}

export function getDailyTapScore(seed: string) {
    const data = localStorage.getItem(`daily-tap-score-${seed}`);
    return data ? JSON.parse(data) : null;
}