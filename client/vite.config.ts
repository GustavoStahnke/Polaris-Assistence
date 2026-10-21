import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Em desenvolvimento, o client roda na porta 5173 e repassa /api para o servidor (3001).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
