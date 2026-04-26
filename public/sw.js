const CACHE_NAME = 'yard-geo-v2';
const GEO_URLS = [
  'https://basemaps.cartocdn.com/',
  'https://server.arcgisonline.com/'
];

// Strategic caching strategy
const getStrategy = (url) => {
  if (url.includes('/api/auth')) return 'network-only';
  if (url.includes('/api/')) return 'stale-while-revalidate';
  if (GEO_URLS.some(base => url.startsWith(base)) || url.includes('.glb') || url.includes('.woff2')) return 'cache-first';
  return 'network-first';
};

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const strategy = getStrategy(url);

  if (strategy === 'network-only') return;

  if (strategy === 'cache-first') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  } else if (strategy === 'stale-while-revalidate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cached || fetchPromise;
        });
      })
    );
  }
});
