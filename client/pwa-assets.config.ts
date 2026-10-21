import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Gera os ícones do app instalável a partir de public/polaris-icon.svg.
// Rode uma vez com: npx pwa-assets-generator (os PNGs ficam em public/ e vão para o git).
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#030814' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#030814' } },
  },
  images: ['public/polaris-icon.svg'],
});
