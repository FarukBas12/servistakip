const CACHE_NAME = 'appnov-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png'
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
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
    self.clients.claim();
});

// Fetch Event: Stratgey -> Stale While Revalidate (Network First for API, Cache First for Assets)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Requests: Network Only (Don't cache sensitive data yet)
    if (url.pathname.startsWith('/api')) {
        return;
    }

    // 2. Static Assets: Cache First, falling back to Network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Optional: Return offline page if network fails
            });
        })
    );
});
