import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notifyBirthDateRequired } from "./age-required";
import { api } from "./api-client";

vi.mock("./auth-hint", () => ({ clearAuthHint: vi.fn() }));
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
    const values = new Map([
      ["session_token", "token-antigo"],
      ["refresh_token", "refresh-antigo"],
    ]);
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
        token: "token-novo",
        refreshToken: "refresh-novo",
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
      expect(localStorage.getItem("session_token")).toBe("token-novo");
      expect(localStorage.getItem("refresh_token")).toBe("refresh-novo");
      expect(location.href).toBe("/feed");
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
      expect(fetchMock.mock.calls[2][1].headers["X-Session-Token"]).toBe("token-novo");
    },
  );

  it("encerra a sessão quando a nova tentativa retorna 401", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(api.get("/recurso")).rejects.toMatchObject({
      status: 401,
      code: "SESSION_EXPIRED",
    });
    expect(localStorage.getItem("session_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(location.href).toBe("/entrar?tab=login");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("mantém o encerramento quando o próprio refresh é recusado", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(localStorage.getItem("session_token")).toBeNull();
    expect(location.href).toBe("/entrar?tab=login");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("devolve os dados da nova tentativa bem-sucedida", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ body: { id: "recurso" } }));

    await expect(api.get("/recurso")).resolves.toEqual({ id: "recurso" });
    expect(localStorage.getItem("session_token")).toBe("token-novo");
  });

  it("aceita uma nova tentativa sem conteúdo", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(api.get("/recurso")).resolves.toBeUndefined();
    expect(localStorage.getItem("session_token")).toBe("token-novo");
  });

  it("mantém o tratamento específico de permissão da operação", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: "BIRTH_DATE_REQUIRED", message: "Informe a data" }, { status: 403 }),
    );

    await expect(api.get("/recurso")).rejects.toMatchObject({ code: "BIRTH_DATE_REQUIRED" });
    expect(notifyBirthDateRequired).toHaveBeenCalledOnce();
    expect(localStorage.getItem("session_token")).toBe("token-novo");
  });

  it("preserva a sessão se a nova tentativa falha na rede", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValueOnce(error);

    await expect(api.get("/recurso")).rejects.toBe(error);
    expect(localStorage.getItem("session_token")).toBe("token-novo");
    expect(location.href).toBe("/feed");
  });
});
