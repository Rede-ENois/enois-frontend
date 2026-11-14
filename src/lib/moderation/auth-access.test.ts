// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ clear: vi.fn(), store: vi.fn(), limited: vi.fn() }));
vi.mock("../api-client", () => ({ clearSession: mocks.clear }));
vi.mock("../session", () => ({ storeSession: mocks.store }));
vi.mock("@/stores/sanction-access.store", () => ({
  markSanctionAccess: mocks.limited,
  clearSanctionAccess: vi.fn(),
}));

const { acceptAuthSession } = await import("./auth-access");

beforeEach(() => Object.values(mocks).forEach((mock) => mock.mockReset()));

describe("aceitação de uma sessão emitida pelo servidor", () => {
  it("não transforma acesso restrito em sessão normal", () => {
    expect(
      acceptAuthSession({
        expiresAt: "2026-01-01T12:00:00Z",
        refreshExpiresAt: null,
        user: {
          id: "user_sintetico",
          username: "pessoa_sintetica",
          name: "Pessoa sintética",
          headline: "",
          email: "pessoa@example.invalid",
          emailVerified: true,
          twoFactorEnabled: false,
          identityVerified: true,
          hasPassword: true,
        },
        accessScope: "SANCTIONS_ONLY",
      }),
    ).toBe("SANCTIONS_ONLY");
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(mocks.limited).toHaveBeenCalledOnce();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it("troca o estado anterior somente depois de uma resposta normal confirmada", () => {
    const response = {
      expiresAt: "2026-01-01T12:00:00Z",
      refreshExpiresAt: "2026-01-02T12:00:00Z",
      accessScope: "FULL" as const,
      user: {
        id: "user_sintetico",
        username: "pessoa_sintetica",
        name: "Pessoa sintética",
        headline: "",
        email: "pessoa@example.invalid",
        emailVerified: true,
        twoFactorEnabled: false,
        identityVerified: true,
        hasPassword: true,
      },
    };
    expect(acceptAuthSession(response)).toBe("FULL");
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(mocks.limited).not.toHaveBeenCalled();
    expect(mocks.store).toHaveBeenCalledWith(response);
  });
});
