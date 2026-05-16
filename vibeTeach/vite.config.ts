import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // base not required with HashRouter; keep default
    server: { port: 5173 }
});
