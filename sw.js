// NOME DO CACHE: Um nome único para o cache da sua aplicação.
// Se você fizer grandes alterações no futuro (como mudar o layout),
// mude este nome (ex: 'telelab-cache-v2') para forçar a atualização de todos os arquivos.
const CACHE_NAME = 'telelab-cache-v1';

// ARQUIVOS PARA CACHE: Lista de todos os recursos essenciais para a aplicação funcionar offline.
// Isso inclui a página principal, folhas de estilo, fontes e o manifest.json.
const aCachear = [
    '/', // A página HTML principal (index.html)
    'manifest.json', // Arquivo de manifesto para a instalação do PWA
    'https://cdn.tailwindcss.com', // O framework de CSS Tailwind
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', // A folha de estilo da fonte
    'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2' // O arquivo da fonte (o URL pode variar, mas o service worker o capturará da rede na primeira vez)
];

// EVENTO 'INSTALL': Disparado quando o service worker é instalado pela primeira vez.
// Aqui, abrimos o cache e armazenamos todos os arquivos essenciais.
self.addEventListener('install', (e) => {
    console.log('Service Worker: Instalando...');
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('Service Worker: Adicionando arquivos ao cache');
            // 'addAll' pega a lista de URLs, busca cada um e adiciona a resposta ao cache.
            // Se qualquer um dos arquivos falhar ao ser baixado, a instalação inteira falha.
            return cache.addAll(aCachear);
        })
        .then(() => {
            console.log('Service Worker: Instalação completa');
            // Força o novo service worker a se tornar ativo imediatamente.
            self.skipWaiting();
        })
    );
});

// EVENTO 'ACTIVATE': Disparado quando o service worker é ativado.
// É usado para limpar caches antigos e garantir que a aplicação use os arquivos mais recentes.
self.addEventListener('activate', (e) => {
    console.log('Service Worker: Ativando...');
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // Se um nome de cache não for o atual, ele é deletado.
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Limpando cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Garante que o service worker ativado assuma o controle da página imediatamente.
    return self.clients.claim();
});

// EVENTO 'FETCH': Disparado toda vez que a aplicação tenta buscar um recurso (ex: uma imagem, um script, uma página).
// Esta é a parte principal da estratégia offline-first.
self.addEventListener('fetch', (e) => {
    console.log('Service Worker: Buscando recurso:', e.request.url);
    e.respondWith(
        // 1. Tenta encontrar o recurso no CACHE primeiro.
        caches.match(e.request)
        .then((resposta) => {
            if (resposta) {
                // Se o recurso foi encontrado no cache, retorna a resposta do cache.
                console.log('Service Worker: Recurso encontrado no cache:', e.request.url);
                return resposta;
            }

            // 2. Se não estiver no cache, tenta buscar na REDE.
            console.log('Service Worker: Recurso não encontrado no cache, buscando na rede...');
            return fetch(e.request)
                .then((respostaRede) => {
                    // Se a busca na rede falhar, não faz nada (o navegador mostrará o erro de offline).
                    if (!respostaRede || respostaRede.status !== 200 || respostaRede.type !== 'basic' && respostaRede.type !== 'cors') {
                        return respostaRede;
                    }

                    // Se a busca na rede for bem-sucedida, clonamos a resposta.
                    // Uma resposta só pode ser "consumida" uma vez. Precisamos de uma cópia para o cache e outra para o navegador.
                    const respostaParaCache = respostaRede.clone();

                    // Abre o cache e armazena a nova resposta para uso futuro.
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(e.request, respostaParaCache);
                        });
                    
                    console.log('Service Worker: Recurso da rede armazenado no cache:', e.request.url);
                    // Retorna a resposta original da rede para o navegador.
                    return respostaRede;
                });
        }).catch(err => {
            // Em caso de erro (ex: falha na rede quando o item não está no cache),
            // você poderia retornar uma página offline de fallback aqui, se tivesse uma.
            console.error('Service Worker: Erro ao buscar recurso.', err);
        })
    );
});
