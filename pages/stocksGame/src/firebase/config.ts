import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const STORAGE_KEY = 'firebase_config';

export function getStoredConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export function initFirebase() {
    const config = getStoredConfig();
    if (!config) throw new Error('No Firebase config found in localStorage');
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    return { auth: getAuth(app), db: getDatabase(app) };
}

const { auth, db } = getStoredConfig()
    ? initFirebase()
    : { auth: null, db: null };

export { auth, db };