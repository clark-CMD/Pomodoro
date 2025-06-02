
const CACHE_NAME = 'pomodoro-timer-cache-v3'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Main TSX file
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  // Tailwind CSS from CDN
  'https://cdn.tailwindcss.com',
  // React and ReactDOM from esm.sh (resolved URLs might be more specific in practice)
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0/client',
  'https://esm.sh/react@^19.1.0/jsx-runtime', // For JSX
  // Note: The actual URLs resolved by esm.sh might include specific versions or sub-paths.
  // It's good to check network tab for exact URLs to cache if being very precise.
  // For example, specific files like:
  // 'https://esm.sh/v135/react@19.1.0/es2022/react.mjs',
  // 'https://esm.sh/v135/react-dom@19.1.0/es2022/client.mjs',
  // 'https://esm.sh/v135/react@19.1.0/es2022/jsx-runtime.mjs',
  // However, caching the ^ version URLs should work with stale-while-revalidate.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        const promises = urlsToCache.map((url) => {
          // For CDN resources, use 'cors' mode. For local, default 'no-cors' is fine.
          const request = new Request(url, { mode: (url.startsWith('https://esm.sh') || url.startsWith('https://cdn.tailwindcss.com')) ? 'cors' : 'no-cors' });
          return fetch(request)
            .then(response => {
              if (!response.ok) {
                console.warn('Failed to fetch and cache during install:', url, response.status);
                return Promise.resolve(); 
              }
              return cache.put(request, response); // Use request object as key
            })
            .catch(err => {
              console.warn('Failed to fetch and cache (network error) during install:', url, err);
              return Promise.resolve();
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
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Stale-while-revalidate for CDN assets (Tailwind, esm.sh)
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
            // If offline and not in cache, this will error. If in cache, cachedResponse is already served.
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-first for local assets (index.html, /, /index.tsx, icons, manifest)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; 
        }
        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || !networkResponse.ok || networkResponse.status === 404) {
              console.warn('Network fetch failed or resource not found (local):', event.request.url, networkResponse ? networkResponse.status : 'No response');
              return networkResponse; 
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed (local):', event.request.url, error);
          // For navigation requests, you might want to return an offline fallback page.
          // if (event.request.mode === 'navigate') {
          //   return caches.match('/offline.html'); // Ensure offline.html is cached
          // }
        });
      })
  );
});
