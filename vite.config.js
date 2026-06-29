import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: {
        config: true,
        overrideManifestIcons: true,
      },
      manifest: {
        name: 'VolleyScore',
        short_name: 'VolleyScore',
        description: 'VolleyScore 是支援遠端遙控的排球記分板，可用平板顯示比分、手機遠端操控。',
        start_url: '/',
        display: 'standalone',
        theme_color: '#485696',
        background_color: '#485696',
        orientation: 'landscape',
        categories: ['sports'],
        icons: [],
        screenshots: [
          {
            src: '/img/scoreCounter.jpg',
            sizes: '1280x720',
            type: 'image/jpg',
            platform: 'wide',
            label: 'Score display view',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // App 導覽請求：優先走網路，逾時 3 秒 fallback 快取
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 3,
              cacheName: 'navigation-cache',
            },
          },
          {
            // Vercel Analytics：不快取，永遠走網路
            urlPattern: /\/_vercel\/insights\//,
            handler: 'NetworkOnly',
          },
          {
            // Firebase Realtime Database：不快取，永遠走網路
            urlPattern: /^https:\/\/.*\.firebasedatabase\.app\//,
            handler: 'NetworkOnly',
          },
          {
            // Firebase SDK / gstatic：不快取
            urlPattern: /^https:\/\/www\.gstatic\.com\//,
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts：快取優先
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
