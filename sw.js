const CACHE_NAME = 'pomodoro-timer-cache-v2'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  'https://cdn.tailwindcss.com',
  // URLs from importmap
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0/client', // Main import from react-dom
  // Potentially other dynamic imports from esm.sh if they resolve to unique URLs.
  // e.g. https://esm.sh/react@^19.1.0/jsx-runtime for JSX
  'https://esm.sh/react@^19.1.0/jsx-runtime', 
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        // Add all URLs to cache, but don't fail install if some CDN resources fail
        // Individual fetch requests allow for this flexibility
        const promises = urlsToCache.map((url) => {
          return fetch(new Request(url, { mode: 'cors' })) // Ensure CORS for CDN assets
            .then(response => {
              if (!response.ok) {
                // Don't throw error to break install, just log it
                console.warn('Failed to fetch and cache:', url, response.status);
                return Promise.resolve(); // Resolve so Promise.all doesn't reject
              }
              return cache.put(url, response);
            })
            .catch(err => {
              console.warn('Failed to fetch and cache during install:', url, err);
              return Promise.resolve(); // Resolve so Promise.all doesn't reject
            });
        });
        return Promise.all(promises);
      })
      .then(() => {
        console.log('All specified resources have been processed for caching.');
      })
      .catch(err => {
        console.error('Cache open/add failed during install:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the new service worker takes control immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // For esm.sh or cdn.tailwindcss.com, use a stale-while-revalidate strategy
  // to ensure they can update but still serve quickly from cache.
  if (requestUrl.hostname === 'esm.sh' || requestUrl.hostname === 'cdn.tailwindcss.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.warn('Network fetch failed for CDN resource:', event.request.url, err);
            // If fetch fails (offline) and not in cache, this will result in error
            // but if in cache, cachedResponse is already served.
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For local assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Serve from cache
        }
        // Not in cache, fetch from network, cache it, and then return
        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || !networkResponse.ok || networkResponse.status === 404) {
              // If the resource is critical and not found, this could be an issue.
              // For non-critical or dynamically generated content, this might be fine.
              console.warn('Network fetch failed or resource not found:', event.request.url, networkResponse ? networkResponse.status : 'No response');
              return networkResponse; // Return the error response or undefined
            }
            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed:', event.request.url, error);
          // You could return a custom offline page here if desired for HTML pages
          // For assets, this will likely result in a broken UI element if not cached.
          // e.g. if (event.request.mode === 'navigate') return caches.match('/offline.html');
        });
      })
  );
});
