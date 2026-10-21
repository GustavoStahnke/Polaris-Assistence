import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Em desenvolvimento, o client roda na porta 5173 e repassa /api para o servidor (3001).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // App instalável (PWA): ícone da estrela, tema escuro e funcionamento offline da interface.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'polaris-star.svg'],
      manifest: {
        name: 'Polaris Assistence',
        short_name: 'Polaris',
        description: 'Seu sistema pessoal tudo-em-um: agenda, e-mail, notícias, livros, treino e mais.',
        lang: 'pt-BR',
        theme_color: '#030814',
        background_color: '#030814',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // A API nunca vai para o cache do navegador (os dados ficam no servidor local).
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Separa as bibliotecas grandes em arquivos próprios (o navegador guarda em cache).
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-.*|victory-vendor)[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
});
