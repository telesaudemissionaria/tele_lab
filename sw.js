// Define um nome e versão para o cache
const CACHE_NAME = 'lab-interpreter-cache-v1';
// Lista de ficheiros a serem guardados no cache para funcionamento offline
const urlsToCache = [
  './', // O ficheiro HTML principal
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Evento de Instalação: é acionado quando o service worker é instalado
self.addEventListener('install', event => {
  // Espera até que o cache seja aberto e todos os ficheiros sejam adicionados
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Ativação: limpa caches antigos se houver uma nova versão
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de Fetch: interceta os pedidos de rede
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar o recurso no cache primeiro
    caches.match(event.request)
      .then(response => {
        // Se o recurso for encontrado no cache, retorna-o
        if (response) {
          return response;
        }
        // Se não for encontrado no cache, faz o pedido à rede
        return fetch(event.request);
      }
    )
  );
});
