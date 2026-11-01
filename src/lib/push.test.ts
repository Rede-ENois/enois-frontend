// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { enablePush, isPushActive, matchesCurrentKey, pushErrorMessage } from "./push";

/**
 * O que a tela de avisos precisa garantir, além de "chamou a API":
 *
 * - não pedir permissão antes de um clique (o `enablePush` só roda no handler do botão);
 * - não reutilizar inscrição presa a OUTRA chave VAPID — o serviço de push recusaria o envio e a
 *   pessoa ficaria com "ligado" na tela e nenhuma notificação chegando;
 * - dizer a verdade quando o navegador já negou a permissão (não abre o pedido de novo).
 */
const PUBLIC_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
/** Outro ponto P-256 (par VAPID novo, ou o de outro ambiente). */
const OTHER_KEY = "BA1c2V4m6o8q0s2u4w6y8A0C2E4G6I8K0M2O4Q6S8U0W2Y4a6c8e0g2i4k6m8o0q2s4u6w8y0A2C";

function bytesOf(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function subscriptionWith(key: string): PushSubscription {
  return {
    endpoint: "https://push.example/device-1",
    options: { applicationServerKey: bytesOf(key).buffer as ArrayBuffer },
    toJSON: () => ({
      endpoint: "https://push.example/device-1",
      keys: { p256dh: "p256dh-key", auth: "auth-key" },
    }),
    unsubscribe: vi.fn(async () => true),
  } as unknown as PushSubscription;
}

function installBrowser(options: {
  permission: NotificationPermission;
  subscription?: PushSubscription | null;
  subscribe?: ReturnType<typeof vi.fn>;
  grantedAfterRequest?: NotificationPermission;
}) {
  const subscribe = options.subscribe ?? vi.fn(async () => subscriptionWith(PUBLIC_KEY));
  const registration = {
    pushManager: {
      getSubscription: vi.fn(async () => options.subscription ?? null),
      subscribe,
    },
  };
  const requestPermission = vi.fn(
    async () =>
      options.grantedAfterRequest ??
      (options.permission === "default" ? "granted" : options.permission),
  );

  vi.stubGlobal("navigator", {
    serviceWorker: {
      register: vi.fn(async () => registration),
      ready: Promise.resolve(registration),
      getRegistration: vi.fn(async () => registration),
    },
  });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { permission: options.permission, requestPermission });

  return { subscribe, requestPermission, registration };
}

describe("avisos no celular", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reconhece a inscricao feita com a chave que o servidor anuncia hoje", () => {
    expect(matchesCurrentKey(subscriptionWith(PUBLIC_KEY), PUBLIC_KEY)).toBe(true);
  });

  it("recusa inscricao presa a outra chave (troca do par VAPID)", () => {
    expect(matchesCurrentKey(subscriptionWith(PUBLIC_KEY), OTHER_KEY)).toBe(false);
  });

  it("nao pede permissao quando o navegador ja negou", async () => {
    const { requestPermission } = installBrowser({ permission: "denied" });
    const result = await enablePush();
    expect(result).toEqual({ ok: false, reason: "denied" });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(pushErrorMessage("denied")).toContain("configurações do navegador");
  });

  it("troca a inscricao morta por uma nova quando a chave do servidor mudou", async () => {
    // Inscricao feita com a chave ANTIGA, servidor anunciando a NOVA.
    const stale = subscriptionWith(PUBLIC_KEY);
    const fresh = subscriptionWith(OTHER_KEY);
    const subscribe = vi.fn(async () => fresh);
    installBrowser({ permission: "default", subscription: stale, subscribe });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ enabled: true, publicKey: OTHER_KEY }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "push_1" }), { status: 201 }));

    const result = await enablePush();

    expect(result).toEqual({ ok: true });
    expect(stale.unsubscribe).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true, applicationServerKey: expect.anything() }),
    );
    // As duas chamadas: config do servidor e registro da inscricao nova.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reaproveita a inscricao valida em vez de criar outra", async () => {
    const valid = subscriptionWith(PUBLIC_KEY);
    const subscribe = vi.fn();
    installBrowser({ permission: "default", subscription: valid, subscribe });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ enabled: true, publicKey: PUBLIC_KEY }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "push_1" }), { status: 201 }));

    expect(await enablePush()).toEqual({ ok: true });
    expect(subscribe).not.toHaveBeenCalled();
    expect(valid.unsubscribe).not.toHaveBeenCalled();
  });

  it("mostra aparelho desligado quando o servidor esta sem VAPID", async () => {
    installBrowser({ permission: "default" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ enabled: false, publicKey: null }), { status: 200 }),
    );

    expect(await enablePush()).toEqual({ ok: false, reason: "server-disabled" });
    expect(pushErrorMessage("server-disabled")).toBe(
      "As notificações no celular ainda não estão disponíveis.",
    );
  });

  it("inscricao com chave antiga conta como desligada e e descartada", async () => {
    const stale = subscriptionWith(PUBLIC_KEY);
    installBrowser({ permission: "granted", subscription: stale });

    expect(await isPushActive(OTHER_KEY)).toBe(false);
    expect(stale.unsubscribe).toHaveBeenCalled();
  });

  it("inscricao com a chave certa conta como ligada", async () => {
    installBrowser({ permission: "granted", subscription: subscriptionWith(PUBLIC_KEY) });
    expect(await isPushActive(PUBLIC_KEY)).toBe(true);
  });
});
