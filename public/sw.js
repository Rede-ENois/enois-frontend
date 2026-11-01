/**
 * Service worker do Énóis.
 *
 * Estratégia para não servir bundle antigo depois de um deploy:
 * - navegação: network-only **com `cache: "no-store"`**; sem rede cai na página offline. HTML
 *   nunca é guardado: páginas logadas não podem ser servidas do cache (aparelho compartilhado,
 *   sessão já encerrada) e cada HTML leva um nonce de CSP de uso único;
 * - estáticos (script/style/imagem/fonte): stale-while-revalidate — são versionados por hash no
 *   nome, então o cache não fica velho por muito tempo;
 * - API (/api e requisições não-GET): nunca passa pelo cache.
 *
 * IMPORTANTE: ao mudar este arquivo, incremente VERSION. O `activate` apaga os caches antigos e o
 * cliente recarrega sozinho quando o novo SW assume (ver src/lib/pwa.ts).
 */

const VERSION = "enois-v10";
const STATIC_CACHE = `${VERSION}-static`;

const PRECACHE = [
  "/offline.html",
  "/brand/mark-primary.svg",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/brand-icon-192.png",
  "/icons/brand-icon-512.png",
  "/icons/brand-icon-maskable-512.png",
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
      icon: "/icons/brand-icon-192.png",
      badge: "/icons/brand-icon-192.png",
      data: { url },
      tag: data.tag || undefined,
    }),
  );
});

/**
 * O navegador trocou a inscricao (limpeza do servico de push, troca de conta no aparelho). Recria
 * e avisa a aba para registrar a nova no backend.
 *
 * A chave vem do proprio evento: o Chrome entrega a inscricao nova pronta (`newSubscription`) e o
 * Firefox entrega a antiga, cuja chave ainda serve. Nao da para buscar a chave no servidor daqui:
 * em producao a API mora em outro host (`VITE_API_BACKEND`) e este arquivo nao conhece a URL.
 * Sem chave nenhuma nada e recriado — o proximo carregamento do app ve que nao ha inscricao, mostra
 * "desligado" e a pessoa liga de novo (`syncPushSubscription` em src/lib/push.ts).
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  const renovada = event.newSubscription
    ? Promise.resolve(event.newSubscription)
    : Promise.resolve(event.oldSubscription?.options?.applicationServerKey).then((chave) =>
        chave
          ? self.registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: chave,
            })
          : null,
      );

  event.waitUntil(
    renovada
      .then((subscription) => {
        if (!subscription) return undefined;
        return self.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((clients) => {
            for (const client of clients) {
              client.postMessage({
                type: "enois:push-subscription",
                subscription: subscription.toJSON(),
              });
            }
          });
      })
      .catch(() => undefined),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notificacoes";

  // O href que o backend manda na notificacao e um caminho de API ("/api/feed/posts/xxx"), e a
  // rota do APP esta na tabela do front (src/utils/navigation.ts), que o service worker nao
  // conhece. Navegar direto para o href abriria a API em vez do post. Entao o worker pergunta a
  // aba: quem tem a tabela de rotas e traduz.
  const ehCaminhoDeApi = url.startsWith("/api/");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Se o app ja esta aberto, so foca e navega (evita abrir outra aba).
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if (ehCaminhoDeApi && "postMessage" in client) {
            client.postMessage({ type: "enois:navigate", href: url });
          } else if ("navigate" in client) {
            client.navigate(url).catch(() => {});
          }
          return undefined;
        }
      }
      // Sem aba aberta: o caminho de API nao abre nada de util — abre as notificacoes do app.
      return self.clients.openWindow(ehCaminhoDeApi ? "/notificacoes" : url);
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
      fetch(request, { cache: "no-store" }).catch(() =>
        caches
          .match("/offline.html")
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
