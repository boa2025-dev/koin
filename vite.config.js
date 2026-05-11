import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ikoin',
        short_name: 'ikoin',
        description: 'Tu app financiera universitaria',
        theme_color: '#080B14',
        background_color: '#080B14',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) return 'three-vendor'
          if (id.includes('firebase')) return 'firebase-vendor'
          if (id.includes('recharts') || id.includes('d3')) return 'charts-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
