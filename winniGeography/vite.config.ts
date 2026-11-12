import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'geojson-loader',
            transform(_src, id) {
                if (id.endsWith('.geojson')) {
                    const data = readFileSync(id, 'utf-8');
                    return `export default ${data}`;
                }
            },
            enforce: 'pre',
        },
    ],
    base: './', // Important for static hosting in a subfolder
    build: {
        outDir: '../pages/winniGeography',
        emptyOutDir: true,
    },
});