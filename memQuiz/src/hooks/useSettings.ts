import { useState } from 'react';

const STORAGE_KEY = 'memquiz_settings';

export interface Settings {
    batchSize: number;
    numberClosePercent: number;
    textCloseDistance: number;
    optionsCount: number; // ✅ NEW
}

const defaultSettings: Settings = {
    batchSize: 7,
    numberClosePercent: 10,
    textCloseDistance: 3,
    optionsCount: 4 // ✅ NEW (Default to 4 options)
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : defaultSettings;
    });

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return { settings, updateSettings };
};