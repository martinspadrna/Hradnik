import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-16.png', 'favicon-32.png', 'pwa-192.svg', 'pwa-512.svg', 'hradnik-app-icon.svg', 'apple-touch-icon.png', 'apple-touch-icon-v011.png', 'apple-touch-icon-ios-v012-test.png', 'icon-192-v011.png', 'icon-512-v011.png'],
      manifest: {
        id: '/',
        name: 'Hradník',
        short_name: 'Hradník',
        description: 'Osobní katalog a deník českých hradů, zámků, zřícenin a dalších historických míst.',
        theme_color: '#080b0e',
        background_color: '#080b0e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'cs',
        icons: [
          { src: '/icon-192-v011.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512-v011.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/apple-touch-icon-ios-v012-test.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}']
      }
    })
  ]
})
