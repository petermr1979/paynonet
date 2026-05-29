/**
 * PNN - Service Worker
 * Offline-first caching strategy for PWA
 */

const CACHE_NAME = 'pnn-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/app.js',
    '/js/warp-animation.js',
    '/js/storage.js',
    '/js/sw-register.js',
    '/manifest.json',
    '/icons/icon-180.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete, skipping waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Cache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[Service Worker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete, claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    event.waitUntil(updateCache(event.request));
                    return cachedResponse;
                }
                
                // Network first for uncached requests
                return fetchAndCache(event.request);
            })
            .catch((error) => {
                console.error('[Service Worker] Fetch failed:', error);
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});

// Fetch from network and update cache
async function fetchAndCache(request) {
    const response = await fetch(request);
    
    // Don't cache non-successful responses
    if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
    }
    
    // Clone the response
    const responseToCache = response.clone();
    
    // Update cache
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, responseToCache);
    
    return response;
}

// Update cache in background
async function updateCache(request) {
    try {
        const response = await fetch(request);
        
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return;
        }
        
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch (error) {
        // Network error, ignore
        console.log('[Service Worker] Background update failed:', error);
    }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => caches.delete(name))
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Background sync for offline transactions (future feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

async function syncTransactions() {
    // Future implementation for syncing offline transactions
    console.log('[Service Worker] Syncing transactions...');
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'Новое уведомление',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'PNN', options)
        );
    }
});
