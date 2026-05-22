import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Use our custom Firebase Messaging SW as the single service worker.
      // VitePWA will inject the Workbox precache manifest into it at build time.
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'firebase-messaging-sw.js',
      injectManifest: {
        swSrc: 'public/firebase-messaging-sw.js',
        swDest: 'dist/firebase-messaging-sw.js',
        maximumFileSizeToCacheInBytes: 10000000,
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
      },
      includeAssets: ['favicon.svg', 'offline.html', 'icons/*.png'],
      manifest: false, // We use our own manifest.json in public/
    }),
  ],
  server: {
    host: true
  }
})
