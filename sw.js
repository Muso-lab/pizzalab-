/**
 * PizzaLab Scientifico - Service Worker (v5)
 * Garantisce funzionamento 100% offline su dispositivi mobili e desktop (PWA).
 * Gestione cache resiliente, stale-while-revalidate e compatibilità completa Chrome Android / GitHub Pages.
 */

const CACHE_NAME = 'pizzalab-v5-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/engine.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// 1. INSTALLAZIONE: memorizza gli asset critici in modo resiliente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Promise.allSettled previene il fallimento dell'intero SW se un asset secondario è temporaneamente non disponibile
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[PizzaLab SW] Risorsa non memorizzata in cache:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. ATTIVAZIONE: pulizia vecchie cache e claim immediato dei client
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PizzaLab SW] Rimozione cache obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Stale-While-Revalidate con supporto offline completo e runtime caching
self.addEventListener('fetch', (event) => {
  // Ignora richieste non-GET
  if (event.request.method !== 'GET') return;

  // Protezione essenziale: gestisci solo schemi HTTP/HTTPS (ignora chrome-extension://, data:, etc.)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Risorsa presente in cache: restituiscila immediatamente per massima velocità (0ms)
        // e aggiorna la copia in cache in background quando la rete è disponibile
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
        }).catch(() => {
          // Offline o errore di rete momentaneo: la risposta dalla cache è già stata fornita con successo
        });
        return cachedResponse;
      }

      // Risorsa non ancora in cache: scarica da rete e memorizza a runtime (es. Google Fonts o asset dinamici)
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      }).catch(async () => {
        // Fallback robusto per navigazione offline (es. apertura diretta o ricaricamento)
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html', { ignoreSearch: true }) ||
                           await caches.match('./', { ignoreSearch: true });
          if (fallback) return fallback;
        }

        // Tentativo finale di recupero da cache
        const fallbackAsset = await caches.match(event.request, { ignoreSearch: true });
        if (fallbackAsset) return fallbackAsset;

        return new Response('PizzaLab Offline - Nessuna connessione di rete', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      });
    })
  );
});
