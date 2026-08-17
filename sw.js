// Service worker mínimo — existe principalmente para satisfazer o
// requisito de "instalável" do Chrome/Android (precisa de um SW
// registado com um handler de fetch). Não faz cache agressivo pra
// não prender versões antigas do app.
const CACHE = "leitor-nfc";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // network-first simples — sempre tenta buscar da rede primeiro,
  // só cai no cache se estiver offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
