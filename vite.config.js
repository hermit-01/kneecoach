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
        globIgnores: ['litertlm/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // The AI runtime (about 22 MB) is cached the first time the helper loads.
            urlPattern: ({ url }) => url.pathname.includes('/litertlm/'),
            handler: 'CacheFirst',
            options: { cacheName: 'litertlm-runtime' },
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
