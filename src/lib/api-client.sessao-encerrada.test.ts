import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./api-client";

/**
 * Sessão que caiu de propósito (troca de senha ou de e-mail) não é "sessão expirada".
 *
 * A API encerra todas as sessões da conta quando a senha ou o e-mail muda, e o 401 seguinte diz
 * isso em `detail`. Antes o cliente trocava o corpo por "Sessão expirada", então quem tinha
 * acabado de trocar a senha era mandado a achar que a conta tinha um problema.
 *
 * O destino do login é o mesmo nos dois casos; o que muda é o aviso que a tela mostra.
 */
describe("sessão encerrada pela troca de senha", () => {
  let valores: Map<string, string>;

  beforeEach(() => {
    valores = new Map<string, string>([
      ["session_active", "1"],
      ["session_expires_at", String(Date.now() + 10 * 60_000)],
      ["refresh_expires_at", String(Date.now() + 30 * 24 * 3600 * 1000)],
    ]);
    vi.stubGlobal("window", {
      location: { href: "", origin: "https://enois.ia.br" },
      addEventListener: () => {},
    });
    vi.stubGlobal("document", { addEventListener: () => {} });
    vi.stubGlobal("localStorage", {
      getItem: (chave: string) => valores.get(chave) ?? null,
      setItem: (chave: string, valor: string) => valores.set(chave, valor),
      removeItem: (chave: string) => valores.delete(chave),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  /** O refresh foi recusado de verdade e a operação também: a sessão acabou. */
  function sessaoMorta(detalheDoPedido?: string) {
    return vi.fn(async (url: string) => {
      if (url.includes("/auth/refresh") || url.includes("/auth/me")) {
        return new Response(JSON.stringify({ code: "INVALID_REFRESH_TOKEN" }), { status: 401 });
      }
      return new Response(
        JSON.stringify({
          code: "UNAUTHENTICATED",
          message: "Sessao invalida ou expirada.",
          ...(detalheDoPedido ? { detail: detalheDoPedido } : {}),
        }),
        { status: 401 },
      );
    });
  }

  it("leva ao login com o aviso de sessão encerrada quando a API diz o motivo", async () => {
    vi.stubGlobal("fetch", sessaoMorta("SESSION_REVOKED"));

    await expect(api.get("/feed")).rejects.toMatchObject({ code: "SESSION_REVOKED" });
    expect((window as unknown as { location: { href: string } }).location.href).toBe(
      "/entrar?tab=login&sessao=encerrada",
    );
    expect(valores.get("session_active")).toBeUndefined();
  });

  it("continua dizendo que expirou quando a API não diz o motivo", async () => {
    vi.stubGlobal("fetch", sessaoMorta());

    await expect(api.get("/feed")).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect((window as unknown as { location: { href: string } }).location.href).toBe(
      "/entrar?tab=login",
    );
  });
});
