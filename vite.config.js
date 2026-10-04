import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/kneecoach/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'KneeCoach',
        short_name: 'KneeCoach',
        description: 'Daily knee exercises with a private helper that runs on your phone',
        theme_color: '#0f5132',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        // The phone test pages must always come from the network: otherwise a phone that
        // has opened the app gets the app (or an old copy of the test) instead of the test.
        globIgnores: ['**/model-test.html', '**/eval.html'],
        navigateFallbackDenylist: [/model-test\.html/, /eval\.html/],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Transformers.js and its ONNX runtime come from jsDelivr (pinned) and are cached for offline use.
            urlPattern: ({ url }) => url.hostname === 'cdn.jsdelivr.net',
            handler: 'CacheFirst',
            options: { cacheName: 'cdn-runtime', cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
});
