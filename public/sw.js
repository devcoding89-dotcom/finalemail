self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// A simple fetch handler is required by PWA specifications
self.addEventListener('fetch', (event) => {
  // Pass through all requests normally
  event.respondWith(fetch(event.request))
})
