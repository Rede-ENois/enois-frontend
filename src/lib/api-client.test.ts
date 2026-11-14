import { texts } from "@/texts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notifyBirthDateRequired } from "./age-required";
import { ApiError, api, renewSession } from "./api-client";

vi.mock("./auth-hint", () => ({ clearAuthHint: vi.fn(), setAuthHint: vi.fn() }));
vi.mock("./query-client", () => ({ resetSessionScopedData: vi.fn() }));
vi.mock("./age-required", () => ({
  notifyBirthDateRequired: vi.fn(),
  notifyParentalConsentRequired: vi.fn(),
}));
vi.mock("./device-id", () => ({ getDeviceId: () => "" }));

describe("resposta da operação após renovar a sessão", () => {
  const fetchMock = vi.fn();
  const location = { origin: "https://enois.ia.br", href: "/feed" };

  beforeEach(() => {
    vi.clearAllMocks();
    const values = new Map([["session_active", "1"]]);
    vi.stubGlobal("window", { location });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    location.href = "/feed";
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(
      Response.json({
        expiresAt: "2099-01-01T00:00:00Z",
        refreshExpiresAt: "2099-02-01T00:00:00Z",
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([403, 429, 500, 502, 503])(
    "preserva a sessão e o erro da operação quando a nova tentativa retorna %s",
    async (status) => {
      fetchMock.mockResolvedValueOnce(
        Response.json({ code: "OPERATION_FAILED", message: "Falha da operação" }, { status }),
      );

      await expect(api.get("/recurso")).rejects.toMatchObject({
        name: "ApiError",
        status,
        code: "OPERATION_FAILED",
        message: "Falha da operação",
        path: "/recurso",
      });
      expect(localStorage.getItem("session_active")).toBe("1");
      expect(location.href).toBe("/feed");
      expect(fetchMock).toHaveBeenCalledTimes(3);
      // The refresh rides on the cookie: no token in the body.
      expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
      expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: "include", body: undefined });
      // The retry carries the cookies and the CSRF header, never a token header.
      expect(fetchMock.mock.calls[2][1].credentials).toBe("include");
      expect(fetchMock.mock.calls[2][1].headers["X-CSRF-Protection"]).toBe("1");
      expect(fetchMock.mock.calls[2][1].headers).not.toHaveProperty("X-Session-Token");
    },
  );

  it("encerra a sessão quando a nova tentativa retorna 401", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(api.get("/recurso")).rejects.toMatchObject({
      status: 401,
      code: "SESSION_EXPIRED",
    });
    expect(localStorage.getItem("session_active")).toBeNull();
    expect(location.href).toBe("/entrar?tab=login");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("mantém o encerramento quando o próprio refresh é recusado", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));
    // No other tab renewed either: /auth/me also refuses.
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(localStorage.getItem("session_active")).toBeNull();
    expect(location.href).toBe("/entrar?tab=login");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toBe("/api/auth/me");
  });

  it("devolve os dados da nova tentativa bem-sucedida", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ body: { id: "recurso" } }));

    await expect(api.get("/recurso")).resolves.toEqual({ id: "recurso" });
    expect(localStorage.getItem("session_active")).toBe("1");
  });

  it("aceita uma nova tentativa sem conteúdo", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(api.get("/recurso")).resolves.toBeUndefined();
    expect(localStorage.getItem("session_active")).toBe("1");
  });

  it("aceita 200 com corpo vazio em vez de estourar no json", async () => {
    // É a resposta do catch-all para caminho fora da superfície: 200 e zero bytes. Tentar
    // interpretar isso como JSON virava "Unexpected end of JSON input" na cara de quem salvava.
    fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));

    await expect(api.get("/recurso")).resolves.toBeUndefined();
    expect(localStorage.getItem("session_active")).toBe("1");
  });

  it("aceita corpo em branco sem Content-Length declarado", async () => {
    // Alguns proxies entregam o corpo vazio como stream sem `Content-Length`; o critério tem que
    // ser o conteúdo lido, não o cabeçalho.
    fetchMock.mockResolvedValueOnce(new Response("   ", { status: 200 }));

    await expect(api.get("/recurso")).resolves.toBeUndefined();
  });

  it("mantém o tratamento específico de permissão da operação", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: "BIRTH_DATE_REQUIRED", message: "Informe a data" }, { status: 403 }),
    );

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "BIRTH_DATE_REQUIRED" });
    expect(notifyBirthDateRequired).toHaveBeenCalledOnce();
    expect(localStorage.getItem("session_active")).toBe("1");
  });

  it("preserva a sessão se a nova tentativa falha na rede", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValueOnce(error);

    const request = api.get("/recurso");
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
      path: "/recurso",
    });
    expect(localStorage.getItem("session_active")).toBe("1");
    expect(location.href).toBe("/feed");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([429, 500, 502, 503, "rede"])(
    "preserva a sessão sem repetir a operação quando o refresh falha: %s",
    async (failure) => {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
      if (typeof failure === "number") {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: failure }));
      } else {
        fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      }

      const request = api.get("/recurso");
      await expect(request).rejects.toBeInstanceOf(ApiError);
      await expect(request).rejects.toMatchObject({
        status: 0,
        code: "SESSION_CHECK_UNAVAILABLE",
        path: "/recurso",
      });
      expect(localStorage.getItem("session_active")).toBe("1");
      expect(location.href).toBe("/feed");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    },
  );
});

describe("mensagem de erro da API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("explica a recusa por falta do header anti-CSRF", async () => {
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ code: "CSRF_REQUIRED", message: "x" }, { status: 403 })),
    );

    await expect(api.post("/feed/posts", { content: "x" })).rejects.toMatchObject({
      code: "CSRF_REQUIRED",
      message: texts.errors.apiMessages.CSRF_REQUIRED,
    });
  });

  it("troca o texto cru de link não permitido por uma mensagem legível", async () => {
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "UNSAFE_LINK",
            message: "O campo content tem um link com endereco nao permitido",
          },
          { status: 400 },
        ),
      ),
    );

    await expect(api.post("/feed/posts", { content: "x" })).rejects.toMatchObject({
      status: 400,
      code: "UNSAFE_LINK",
      message: texts.errors.apiMessages.UNSAFE_LINK,
    });
  });
});

describe("sessão que não tem mais como renovar", () => {
  const fetchMock = vi.fn();
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map([["session_active", "1"]]);
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("encerra a sessão quando o refresh vem 400 (sem cookie de refresh)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: "INVALID_REFRESH_TOKEN" }, { status: 400 }),
    );
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(values.has("session_active")).toBe(false);
  });

  it("descarta o indicador de sessão depois do vencimento do refresh", async () => {
    values.set("refresh_expires_at", "2000-01-01T00:00:00Z");
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    await api.get("/publico");
    expect(values.has("session_active")).toBe(false);
  });
});

describe("renovação entre abas (Web Locks)", () => {
  const fetchMock = vi.fn();
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map([
      ["session_active", "1"],
      // Longe de vencer: nada de renovação proativa, só a do 401.
      ["session_expires_at", new Date(Date.now() + 3_600_000).toISOString()],
    ]);
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("não renova de novo quando outra aba renovou enquanto esta esperava o lock", async () => {
    const request = vi.fn(async (_name: string, task: () => Promise<unknown>) => {
      // A outra aba segurava o lock e renovou: a validade guardada andou para frente.
      values.set("session_expires_at", new Date(Date.now() + 7_200_000).toISOString());
      return task();
    });
    vi.stubGlobal("navigator", { locks: { request } });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    await expect(api.get("/recurso")).resolves.toEqual({ ok: true });
    expect(request).toHaveBeenCalledWith("enois-refresh", expect.any(Function));
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual(["/api/recurso", "/api/recurso"]);
  });

  it("renova dentro do lock quando ninguém renovou antes", async () => {
    const request = vi.fn(async (_name: string, task: () => Promise<unknown>) => task());
    vi.stubGlobal("navigator", { locks: { request } });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(
      Response.json({
        expiresAt: "2099-01-01T00:00:00Z",
        refreshExpiresAt: "2099-02-01T00:00:00Z",
      }),
    );
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));

    await expect(api.get("/recurso")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
  });
});

describe("renewSession", () => {
  const fetchMock = vi.fn();
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map([["session_active", "1"]]);
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("records the expiry of a session that arrived without one (OAuth return)", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        expiresAt: "2099-01-01T00:00:00Z",
        refreshExpiresAt: "2099-02-01T00:00:00Z",
      }),
    );

    await expect(renewSession()).resolves.toBe("renewed");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/refresh");
    expect(values.get("session_expires_at")).toBe("2099-01-01T00:00:00Z");
    expect(values.get("refresh_expires_at")).toBe("2099-02-01T00:00:00Z");
  });
});

describe("envio multipart", () => {
  const fetchMock = vi.fn();
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map([["session_active", "1"]]);
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/perfil" } });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("sends FormData as-is and renews the session on 401 like any other call", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(
      Response.json({
        expiresAt: "2099-01-01T00:00:00Z",
        refreshExpiresAt: "2099-02-01T00:00:00Z",
      }),
    );
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));
    const form = new FormData();
    form.append("file", new Blob(["pdf"]), "cv.pdf");

    await expect(api.post("/me/import/resume", form, { idempotent: false })).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    const retry = fetchMock.mock.calls[2][1];
    expect(retry.body).toBe(form);
    expect(retry.headers).not.toHaveProperty("Content-Type");
    expect(retry.credentials).toBe("include");
  });
});

describe("chamadas de sessão com prazo", () => {
  const fetchMock = vi.fn();
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map([["session_active", "1"]]);
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("bounds /auth/refresh and /auth/me with a timeout signal", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetchMock.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
    expect(fetchMock.mock.calls[2][0]).toBe("/api/auth/me");
    expect(fetchMock.mock.calls[2][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("treats a timed-out refresh as unavailable and keeps the session", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "SESSION_CHECK_UNAVAILABLE" });
    expect(values.get("session_active")).toBe("1");
  });
});

describe("cancelamento da requisição", () => {
  const fetchMock = vi.fn();
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map([["session_active", "1"]]);
    vi.stubGlobal("window", { location: { origin: "https://enois.ia.br", href: "/feed" } });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("passa o sinal do chamador ao fetch", async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce(Response.json({ body: { ok: true } }));

    await api.get("/search?q=ana", { signal: controller.signal });

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("não dispara o fetch quando o sinal já está abortado", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(api.get("/search?q=ana", { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propaga abort como cancelamento, e não como falha de rede", async () => {
    const controller = new AbortController();
    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    await expect(api.get("/search?q=ana", { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("escrita cancelada não é repetida", async () => {
    const controller = new AbortController();
    fetchMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    await expect(
      api.post("/posts", { text: "oi" }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    // Uma única tentativa: repetir uma escrita que a pessoa cancelou seria enviar sem querer.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
