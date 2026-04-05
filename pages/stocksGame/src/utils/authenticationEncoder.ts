// utils/configEncoder.ts
import { STORAGE_KEY } from '../firebase/config';

export function encodeConfigToBase64(config: any): string {
    // Convert config to JSON string, then to Base64
    const jsonString = JSON.stringify(config);
    // Use btoa for browser, handle Unicode
    const base64 = btoa(encodeURIComponent(jsonString));
    return base64;
}

export function decodeConfigFromBase64(encoded: string): any {
    try {
        // Decode Base64 back to JSON
        const jsonString = decodeURIComponent(atob(encoded));
        const config = JSON.parse(jsonString);

        // Validate required fields
        const required = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
        const hasAll = required.every(field => config[field]);

        if (!hasAll) throw new Error('Missing required config fields');

        return config;
    } catch (error) {
        console.error('Failed to decode config:', error);
        return null;
    }
}

export function saveConfigToLocalStorage(config: any): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('Config saved to localStorage');
}