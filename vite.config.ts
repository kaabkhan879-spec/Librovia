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
      injectRegister: null, // Registered manually in PWAHandler.tsx to support custom update notification
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'Librovia',
        short_name: 'Librovia',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay'],
        background_color: '#0B0F19',
        theme_color: '#8B5CF6',
        orientation: 'portrait',
        description: 'Store, organize, read, and sync your books securely across all your devices.',
        categories: ['books', 'education', 'utilities'],
        icons: [
          {
            src: '/assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/assets/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/assets/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'My Library',
            short_name: 'Library',
            description: 'Open your books list',
            url: '/library',
            icons: [{ src: '/assets/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Shared Library',
            short_name: 'Shared',
            description: 'View shared books',
            url: '/shared-library',
            icons: [{ src: '/assets/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Analytics',
            short_name: 'Analytics',
            description: 'View reading statistics',
            url: '/analytics',
            icons: [{ src: '/assets/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Settings',
            short_name: 'Settings',
            description: 'Change reading settings',
            url: '/settings',
            icons: [{ src: '/assets/icon-192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: '/assets/cozy_library_reading.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Librovia Premium Cinematic Canvas & Shelf View',
          },
          {
            src: '/assets/cozy_library_reading.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Librovia Reading Canvas Mobile View',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/auth/, /^\/rest/, /supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return (
                url.origin.includes('supabase.co') ||
                url.pathname.startsWith('/rest/') ||
                url.pathname.startsWith('/auth/')
              )
            },
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\.(?:js|css|html|svg|png|jpg|jpeg|gif|woff2)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'librovia-assets-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-lucide'
            }
            if (id.includes('supabase') || id.includes('postgrest')) {
              return 'vendor-supabase'
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('react-router')
            ) {
              return 'vendor-react'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer'
            }
            if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
              return 'vendor-pdf'
            }
            return 'vendor-others'
          }
        },
      },
    },
  },
})
