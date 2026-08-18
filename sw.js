// ============================================================
// SERVICE WORKER — GYM Workout
// Coloque este arquivo na RAIZ do repositório, do lado do seu
// index.html (o registro no HTML já aponta pra "/sw.js").
//
// O QUE ELE FAZ:
// Na primeira vez que o app abre com internet, ele salva uma cópia
// de tudo (o HTML, os ícones, e as bibliotecas React/Babel que vêm
// da CDN) direto no celular. Da próxima vez, mesmo sem internet,
// o app carrega a partir dessa cópia salva.
//
// QUANDO VOCÊ ATUALIZAR O APP NO FUTURO:
// Só muda o número da linha CACHE_VERSION abaixo (ex: "v2", "v3"...).
// Isso força o celular a baixar tudo de novo e jogar fora a cópia
// antiga. Se você esquecer disso, a pessoa pode ficar presa numa
// versão antiga do app mesmo com internet.
// ============================================================

const CACHE_VERSION = "v1";
const CACHE_NAME = `gym-workout-${CACHE_VERSION}`;

// Arquivos e endereços que precisam estar disponíveis offline.
// Ajuste os nomes se os seus arquivos tiverem nomes diferentes.
const ARQUIVOS_PARA_SALVAR = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon-32.png",
  "/favicon-16.png",
  "/apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js",
];

// INSTALL — roda quando o service worker é instalado pela primeira vez
// (ou quando CACHE_VERSION muda). Baixa e guarda todos os arquivos.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll falha tudo se UM arquivo falhar: por isso tentamos um a
      // um, pra um ícone com nome errado não quebrar o resto.
      return Promise.all(
        ARQUIVOS_PARA_SALVAR.map((url) =>
          cache.add(url).catch((erro) => {
            console.warn("[sw] não consegui guardar:", url, erro);
          })
        )
      );
    })
  );
  self.skipWaiting(); // ativa a nova versão imediatamente, sem esperar todas as abas fecharem
});

// ACTIVATE — limpa cópias de versões antigas do cache, pra não acumular lixo
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome.startsWith("gym-workout-") && nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

// FETCH — intercepta todo pedido de arquivo do app.
// Estratégia "cache primeiro, rede como reforço": tenta achar no que
// já foi salvo; se não achar, busca na internet e guarda uma cópia
// pra da próxima vez. Isso é o que faz o app funcionar sem internet.
self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;

  evento.respondWith(
    caches.match(evento.request).then((respostaSalva) => {
      if (respostaSalva) return respostaSalva;

      return fetch(evento.request)
        .then((respostaDaRede) => {
          const copia = respostaDaRede.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
          return respostaDaRede;
        })
        .catch(() => {
          // Sem internet e sem cópia salva desse arquivo específico.
          // Se for a página principal, ainda tenta devolver o index.html salvo.
          if (evento.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
