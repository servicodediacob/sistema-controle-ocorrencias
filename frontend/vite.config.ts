// frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Define a porta padrão para o servidor de desenvolvimento
    port: 5173,
    // IMPORTANTE: Faz o Vite falhar se a porta já estiver em uso,
    // em vez de tentar outra. Isso evita erros silenciosos.
    strictPort: true,
  },
  preview: {
    // Garante que o preview também use a mesma porta
    port: 5173,
    strictPort: true,
  },
});
