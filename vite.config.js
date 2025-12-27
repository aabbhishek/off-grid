import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/off-grid/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'OffGrid - Privacy-First Developer Toolkit',
        short_name: 'OffGrid',
        description: 'A collection of developer utilities that process everything locally in your browser.',
        theme_color: '#0a0a14',
        background_color: '#0a0a14',
        display: 'standalone',
        start_url: '/off-grid/',
        scope: '/off-grid/',
        icons: [
          {
            src: '/off-grid/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/off-grid/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
