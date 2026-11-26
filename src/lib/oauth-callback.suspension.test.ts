import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  renew: vi.fn(),
  store: vi.fn(),
  clear: vi.fn(),
  mark: vi.fn(),
  unmark: vi.fn(),
}));
vi.mock("./api/auth", () => ({ authApi: { me: mocks.me } }));
vi.mock("./session", () => ({ storeSession: mocks.store }));
vi.mock("@/stores/sanction-access.store", () => ({
  markSanctionAccess: mocks.mark,
  clearSanctionAccess: mocks.unmark,
}));
vi.mock("./api-client", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  renewSession: mocks.renew,
  clearSession: mocks.clear,
}));
const { ApiError } = await import("./api-client");
const { finishOAuthLogin } = await import("./oauth-callback");
beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));

describe("conclusão do retorno OAuth", () => {
  it.each(["ACCOUNT_SUSPENDED", "SESSION_RESTRICTED"])(
    "encaminha %s sem gravar sessão normal ou renovar",
    async (code) => {
      mocks.me.mockRejectedValue(new ApiError(403, code, "Acesso limitado sintético"));
      await expect(finishOAuthLogin()).resolves.toEqual({ accessScope: "SANCTIONS_ONLY" });
      expect(mocks.clear).toHaveBeenCalledOnce();
      expect(mocks.mark).toHaveBeenCalledOnce();
      expect(mocks.store).not.toHaveBeenCalled();
      expect(mocks.renew).not.toHaveBeenCalled();
    },
  );
  it("não presume suspensão por indisponibilidade", async () => {
    mocks.me.mockRejectedValue(new Error("Rede sintética indisponível"));
    await expect(finishOAuthLogin()).resolves.toBeNull();
    expect(mocks.mark).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });
  it("mantém o percurso normal quando o servidor confirma a identidade", async () => {
    const user = { id: "user_sintetico", name: "Pessoa sintética" };
    mocks.me.mockResolvedValue(user);
    mocks.renew.mockResolvedValue("renewed");
    await expect(finishOAuthLogin()).resolves.toEqual(user);
    expect(mocks.store).toHaveBeenCalledWith({ user });
    expect(mocks.unmark).toHaveBeenCalledOnce();
  });
});
