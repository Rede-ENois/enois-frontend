// @vitest-environment jsdom
import { hasSanctionAccess } from "@/stores/sanction-access.store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "./api-client";
import { hasSessionFlag } from "./session";

vi.mock("./device-id", () => ({ getDeviceId: () => null }));
vi.mock("./api/client-origin", () => ({ clientOriginHeader: () => ({}) }));
vi.mock("./query-client", () => ({ resetSessionScopedData: vi.fn() }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("recusa confirmada por conta suspensa", () => {
  it.each(["ACCOUNT_SUSPENDED", "SESSION_RESTRICTED"])(
    "separa %s de uma sessão normal",
    async (code) => {
      localStorage.setItem("session_active", "1");
      localStorage.setItem("session_expires_at", "2099-01-01T00:00:00Z");
      const fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code, message: "Acesso limitado sintético" }), {
          status: 403,
        }),
      );
      vi.stubGlobal("fetch", fetch);
      await expect(api.get("/recurso-privado-sintetico")).rejects.toBeInstanceOf(ApiError);
      expect(hasSanctionAccess()).toBe(true);
      expect(hasSessionFlag()).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    [401, "UNAUTHENTICATED"],
    [403, "CSRF_REQUIRED"],
    [503, "SERVICE_UNAVAILABLE"],
  ])("não revela nem presume suspensão por HTTP %s/%s", async (status, code) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code, message: "Falha sintética" }), {
          status: Number(status),
        }),
      ),
    );
    await expect(api.get("/recurso-sintetico")).rejects.toBeInstanceOf(ApiError);
    expect(hasSanctionAccess()).toBe(false);
  });

  it("preserva a sessão normal numa falha de rede", async () => {
    localStorage.setItem("session_active", "1");
    localStorage.setItem("session_expires_at", "2099-01-01T00:00:00Z");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Rede sintética indisponível")));
    await expect(api.get("/recurso-sintetico")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(hasSanctionAccess()).toBe(false);
    expect(hasSessionFlag()).toBe(true);
  });
});
