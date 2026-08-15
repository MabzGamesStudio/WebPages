import { IslandFeature } from '../types';

const OVERRIDE_KEY = '__daily_date_override';

function getOverrideDate(): Date | null {
    try {
        const stored = localStorage.getItem(OVERRIDE_KEY);
        if (stored) return new Date(stored);
    } catch { /* ignore storage errors */ }
    return null;
}

// Initialize from localStorage on module load
let overrideDate: Date | null = getOverrideDate();

declare global {
    interface Window {
        setDailyDate?: (dateStr: string) => void;
        resetDailyDate?: () => void;
    }
}

// Expose console commands
if (typeof window !== 'undefined') {
    window.setDailyDate = (dateStr: string) => {
        localStorage.setItem(OVERRIDE_KEY, dateStr);
        window.location.reload();
    };

    window.resetDailyDate = () => {
        localStorage.removeItem(OVERRIDE_KEY);
        window.location.reload();
    };
}

export function getDailySeed(): number {
    const now = overrideDate || new Date();
    const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getDailyIsland(islands: IslandFeature[]): IslandFeature {
    const named = islands.filter(f => f.properties.name && f.properties.name.trim().length > 0);
    if (named.length === 0) {
        throw new Error('No named islands found in dataset');
    }
    const seed = getDailySeed();
    return named[seed % named.length];
}

export function getDailyDateString(): string {
    const now = overrideDate || new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}