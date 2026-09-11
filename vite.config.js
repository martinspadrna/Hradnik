import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const OLD_SUPABASE_URL = 'https://cgshssdjgzzuprlwnabl.supabase.co'
const OLD_SUPABASE_KEY = 'sb_publishable_v7jeuZC-MNUEO5nfE5xcUQ_Pu9pT-X_'
const NEW_SUPABASE_URL = 'https://abqiprdggptuxebhpfyi.supabase.co'
const NEW_SUPABASE_KEY = 'sb_publishable_ICNaKdexQDRj3ga7j8wQrQ_EQi349pw'

function hradnikSupabaseCutoverBuild() {
  return {
    name: 'hradnik-supabase-cutover-build',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.[cm]?[jt]s(?:\?.*)?$/.test(id)) return null
      if (!code.includes(OLD_SUPABASE_URL) && !code.includes(OLD_SUPABASE_KEY)) return null
      return {
        code: code
          .replaceAll(OLD_SUPABASE_URL, NEW_SUPABASE_URL)
          .replaceAll(OLD_SUPABASE_KEY, NEW_SUPABASE_KEY),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [
    hradnikSupabaseCutoverBuild(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'pwa-192.svg', 'pwa-512.svg', 'hradnik-app-icon.svg', 'apple-touch-icon.png'],
      manifest: {
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
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
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
