const CACHE_NAME = 'librovia-pwa-v2.4.0'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/assets/icon-192.png',
  '/assets/icon-192-maskable.png',
  '/assets/icon-512.png',
  '/assets/icon-512-maskable.png',
  '/assets/apple-touch-icon.png',
  '/assets/cozy_library_reading.png',
]

// Install Service Worker and cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate and remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning up old cache:', key)
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)

  // DO NOT cache Supabase API calls, authentication requests, or other dynamic DB endpoints
  if (
    requestUrl.origin.includes('supabase.co') ||
    requestUrl.pathname.startsWith('/rest/') ||
    requestUrl.pathname.startsWith('/auth/') ||
    event.request.method !== 'GET'
  ) {
    // Network only for dynamic data
    event.respondWith(fetch(event.request))
    return
  }

  // Cache-first (or Stale-While-Revalidate) for static assets and App Shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse)
              })
            }
          })
          .catch(() => {
            // Silence network update failures when offline
          })
        return cachedResponse
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }

          // Cache newly requested static assets
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return networkResponse
        })
        .catch(() => {
          // If offline and request is HTML page, return App Shell
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html')
          }
        })
    })
  )
})

// Handle message commands from client (like Skip Waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
