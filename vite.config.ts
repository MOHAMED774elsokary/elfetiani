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
  },
  build: {
    // CSS code splitting — each async chunk gets its own CSS file
    cssCodeSplit: true,
    // Warn on chunks > 500 kB (default is 500, explicitly set for clarity)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split large third-party libraries into separate cacheable chunks
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/lucide-react')) return 'vendor-lucide';
        },
      },
    },
  },
})

