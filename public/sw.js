/**
 * Service worker do Énóis.
 *
 * Estratégia para não servir bundle antigo depois de um deploy:
 * - navegação: network-first **com `cache: "no-store"`** (HTML sempre fresco; o cache HTTP do
 *   navegador não pode segurar o index e forçar os assets antigos);
 * - estáticos (script/style/imagem/fonte): stale-while-revalidate — são versionados por hash no
 *   nome, então o cache não fica velho por muito tempo;
 * - API (/api e requisições não-GET): nunca passa pelo cache.
 *
 * IMPORTANTE: ao mudar este arquivo, incremente VERSION. O `activate` apaga os caches antigos e o
 * cliente recarrega sozinho quando o novo SW assume (ver src/lib/pwa.ts).
 */

const VERSION = "enois-v4";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;

const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const STATIC_DESTINATIONS = ["script", "style", "image", "font"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/") || url.pathname.includes("/api/");
}

/**
 * Web Push. O backend manda { title, body, url }; mostramos a notificacao e, no clique,
 * levamos para a tela certa (o post/perfil/conversa de origem).
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Énóis";
  const url = data.url || "/notificacoes";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
      tag: data.tag || undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notificacoes";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Se o app ja esta aberto, so foca e navega (evita abrir outra aba).
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(url).catch(() => {});
          return undefined;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Só lidamos com o próprio host; terceiros (fontes, backend) passam direto.
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      // no-store: ignora o cache HTTP para o documento, garantindo o HTML do deploy atual.
      fetch(request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"))
            .then(
              (fallback) =>
                fallback ||
                new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } }),
            ),
        ),
    );
    return;
  }

  if (STATIC_DESTINATIONS.includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});