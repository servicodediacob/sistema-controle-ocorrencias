// frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Porta preferencial; Vite escolhera a primeira disponivel quando 5173 estiver ocupada
    port: 5173,
    strictPort: false,
  },
  preview: {
    // Mesmo comportamento para o modo preview
    port: 5173,
    strictPort: false,
  },
});
