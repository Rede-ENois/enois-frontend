import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

const SW_SOURCE = readFileSync(fileURLToPath(new URL("../public/sw.js", import.meta.url)), "utf8");

/** Runs public/sw.js against a fake worker scope and returns its fetch handler and cache spies. */
function loadWorker(network: () => Promise<Response>, windows: unknown[] = []) {
  const listeners: Record<
    string,
    (event: {
      request: { method: string; url: string; mode: string; destination: string };
      respondWith: (response: Promise<Response>) => void;
    }) => void
  > = {};
  const put = vi.fn();
  const offline = new Response("offline page");
  const caches = {
    open: vi.fn(async () => ({ put, addAll: vi.fn() })),
    match: vi.fn(async (key: unknown) => (key === "/offline.html" ? offline : undefined)),
    keys: vi.fn(async () => []),
  };
  const openWindow = vi.fn(async () => null);
  const self = {
    location: { origin: "https://enois.ia.br" },
    addEventListener: (type: string, handler: (typeof listeners)[string]) => {
      listeners[type] = handler;
    },
    clients: { matchAll: vi.fn(async () => windows), openWindow },
  };
  new Function("self", "caches", "fetch", SW_SOURCE)(self, caches, vi.fn(network));
  return { onFetch: listeners.fetch, listeners, caches, put, offline, openWindow };
}

function navigate(onFetch: ReturnType<typeof loadWorker>["onFetch"]): Promise<Response> {
  let responded: Promise<Response> | undefined;
  onFetch({
    request: { method: "GET", url: "https://enois.ia.br/feed", mode: "navigate", destination: "" },
    respondWith: (response) => {
      responded = response;
    },
  });
  return responded!;
}

describe("service worker navigations", () => {
  it("never stores page HTML", async () => {
    const { onFetch, caches, put } = loadWorker(async () => new Response("<html>logado</html>"));

    expect(await (await navigate(onFetch)).text()).toBe("<html>logado</html>");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(caches.open).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("falls back to the offline page, never to a cached page, without network", async () => {
    const { onFetch, caches, offline } = loadWorker(async () => {
      throw new TypeError("offline");
    });

    expect(await navigate(onFetch)).toBe(offline);
    expect(caches.match).toHaveBeenCalledTimes(1);
    expect(caches.match).toHaveBeenCalledWith("/offline.html");
  });
});

describe("clique na notificação push", () => {
  /** Dispara `notificationclick` e espera o trabalho do worker terminar. */
  async function click(
    listener: (event: never) => void,
    url: string,
    notificationId?: string,
  ): Promise<void> {
    let trabalho: Promise<unknown> | undefined;
    listener({
      notification: { close: vi.fn(), data: { url, notificationId } },
      waitUntil: (promise: Promise<unknown>) => {
        trabalho = promise;
      },
    } as never);
    await trabalho;
  }

  it("entrega o href do app para a aba traduzir, sem navegar sozinho", async () => {
    const janela = { focus: vi.fn(), postMessage: vi.fn(), navigate: vi.fn() };
    const { listeners } = loadWorker(async () => new Response(""), [janela]);

    await click(listeners.notificationclick, "/configuracoes/seguranca");

    expect(janela.postMessage).toHaveBeenCalledWith({
      type: "enois:navigate",
      href: "/configuracoes/seguranca",
    });
    expect(janela.navigate).not.toHaveBeenCalled();
  });

  it("sem aba aberta, abre o app com o destino na query", async () => {
    const { listeners, openWindow } = loadWorker(async () => new Response(""), []);

    await click(listeners.notificationclick, "/api/feed/posts/post_1");

    expect(openWindow).toHaveBeenCalledWith("/?push=%2Fapi%2Ffeed%2Fposts%2Fpost_1");
  });

  it("passes the notification id along so the app marks it read", async () => {
    const janela = { focus: vi.fn(), postMessage: vi.fn(), navigate: vi.fn() };
    const aberta = loadWorker(async () => new Response(""), [janela]);
    await click(aberta.listeners.notificationclick, "/feed", "notification_1");
    expect(janela.postMessage).toHaveBeenCalledWith({
      type: "enois:navigate",
      href: "/feed",
      notificationId: "notification_1",
    });

    const fechada = loadWorker(async () => new Response(""), []);
    await click(fechada.listeners.notificationclick, "/feed", "notification_1");
    expect(fechada.openWindow).toHaveBeenCalledWith("/?push=%2Ffeed&n=notification_1");
  });
});
