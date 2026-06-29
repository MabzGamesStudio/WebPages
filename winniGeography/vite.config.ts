import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './', // Important for static hosting in a subfolder
    build: {
        outDir: '../pages/winniGeography',
        emptyOutDir: true,
    },
});