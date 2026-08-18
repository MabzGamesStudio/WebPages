import { IslandFeature } from '../types';

const OVERRIDE_KEY = '__daily_date_override';

function readOverrideDate(): Date | null {
    try {
        const stored = localStorage.getItem(OVERRIDE_KEY);
        if (!stored) return null;
        const d = new Date(stored + (stored.includes('T') ? '' : 'T00:00:00Z'));
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

let overrideDate: Date | null = readOverrideDate();

declare global {
    interface Window {
        setDailyDate?: (dateStr: string) => void;
        resetDailyDate?: () => void;
        getDailyOverrideDate?: () => Date | null;
        getDailySeedDebug?: () => { date: string; seed: number; tapSeed: string };
    }
}

function normalizeDateInput(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date: "${dateStr}". Use YYYY-MM-DD format.`);
    }
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

if (typeof window !== 'undefined') {
    window.setDailyDate = (dateStr: string) => {
        try {
            const normalized = normalizeDateInput(dateStr);
            localStorage.setItem(OVERRIDE_KEY, normalized);
            overrideDate = new Date(normalized + 'T00:00:00Z');
            console.log(`[dailySeed] Date override set to "${normalized}". Reloading...`);
            window.location.reload();
        } catch (e) {
            console.error('[dailySeed] setDailyDate failed:', e);
        }
    };

    window.resetDailyDate = () => {
        localStorage.removeItem(OVERRIDE_KEY);
        overrideDate = null;
        console.log('[dailySeed] Date override cleared. Reloading...');
        window.location.reload();
    };

    window.getDailyOverrideDate = () => overrideDate;

    window.getDailySeedDebug = () => ({
        date: getDailyDateString(),
        seed: getDailySeed(),
        tapSeed: getDailyTapSeed(),
    });
}

export function getOverrideDate(): Date | null {
    return overrideDate;
}

export function getDailyDateString(): string {
    const now = overrideDate || new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function getDailySeed(): number {
    return simpleHash(getDailyDateString());
}

export function getDailyIsland(islands: IslandFeature[]): IslandFeature {
    const named = islands.filter(f => f.properties.name && f.properties.name.trim().length > 0);
    if (named.length === 0) {
        throw new Error('No named islands found in dataset');
    }
    const seed = getDailySeed();
    return named[seed % named.length];
}

/**
 * Tap game seed — same date as the other daily game, with a suffix
 * so the two games pick different islands on the same day.
 */
export function getDailyTapSeed(): string {
    return `${getDailyDateString()}-tap`;
}

/**
 * Returns 3 deterministic islands for the tap game based on the daily seed.
 * Uses a seeded Fisher–Yates shuffle (proper randomization) instead of
 * a comparator sort which was producing ties / unstable ordering.
 */
export function getDailyTapIslands(features: any[], seed: string): any[] {
    const validIslands = features.filter(
        f => f?.properties?.name && f.properties.name.trim().length > 0
    );

    if (validIslands.length === 0) return [];

    const rng = mulberry32(simpleHash(seed));
    const shuffled = [...validIslands];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3);
}

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}