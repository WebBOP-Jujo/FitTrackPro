import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRÍTICO: Esto permite que la app funcione en subcarpetas (como nombre-usuario.github.io/repo)
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});