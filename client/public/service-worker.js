const CACHE_NAME = 'appnov-cache-v2'; // Bumped version
const STATIC_ASSETS = [
    '/manifest.json',
    '/logo.png'
    // removed index.html from here to force network-first logic below
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control immediately
});

// Fetch Event: Stratgey -> Network First for HTML, Cache First for Assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Requests: Network Only
    if (url.pathname.startsWith('/api')) {
        return;
    }

    // 2. Navigation (HTML): Network First (ensure latest version)
    // If network fails, try cache (for offline capability)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache for offline use
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request); // Fallback to cached index.html
                })
        );
        return;
    }

    // 3. Static Assets (JS, CSS, Images): Cache First (for performance)
    // Vite hashes filenames, so if index.html updates, it requests NEW filenames.
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((netRes) => {
                // Cache new assets dynamically
                const clone = netRes.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return netRes;
            });
        })
    );
});
