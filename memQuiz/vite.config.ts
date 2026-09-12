import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: path.resolve(__dirname, '../pages/memQuiz'),
        emptyOutDir: true,
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "./src/styles/_variables" as *;`,
            },
        },
    },
});