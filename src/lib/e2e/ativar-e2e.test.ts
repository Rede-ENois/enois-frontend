import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Ativar o E2E numa conta sem senha (login social) tem uma ordem que NÃO é livre.
 *
 * Trocar a senha **encerra todas as sessões** da conta — inclusive a que está em uso
 * (`AuthService.changePassword` → `revokeAllByUser`). Na ordem antiga (trocar a senha, depois
 * guardar o keypair), o upload saía com a sessão morta: `POST /e2e/keypair` respondia **401**,
 * o banner caía em "Não foi possível definir a senha" e a pessoa ficava sem chave E com a senha
 * já trocada — o E2E não podia mais ser ativado.
 *
 * Confirmado no backend (2026-10-28): depois de `POST /auth/password/change`, a sessão
 * responde 401 e o upload do keypair também.
 *
 * Este teste trava a ordem: o keypair sobe ANTES da troca de senha, e a sessão local é limpa
 * depois (a troca a encerrou no servidor).
 */
const generateAndUpload = vi.fn<(senha: string) => Promise<void>>();
const changePassword =
  vi.fn<(dados: { currentPassword: string; newPassword: string }) => Promise<unknown>>();
const clearSession = vi.fn();

vi.mock("@/lib/e2e/key-manager", () => ({ generateAndUpload }));
vi.mock("@/lib/api/auth", () => ({ authApi: { changePassword } }));
vi.mock("@/lib/api-client", () => ({ clearSession }));

const ordem: string[] = [];

describe("ativação do E2E numa conta sem senha", () => {
  beforeEach(() => {
    ordem.length = 0;
    generateAndUpload.mockReset();
    changePassword.mockReset();
    clearSession.mockReset();
    generateAndUpload.mockImplementation(async () => {
      ordem.push("keypair");
    });
    changePassword.mockImplementation(async () => {
      ordem.push("senha");
      return { status: "PASSWORD_CHANGED" };
    });
    clearSession.mockImplementation(() => ordem.push("limpa"));
    vi.stubGlobal("window", { location: { href: "" } });
  });

  it("guarda o keypair ANTES de trocar a senha (a troca encerra a sessão)", async () => {
    const { ativarE2eComNovaSenha } = await import("./ativar-e2e");

    await ativarE2eComNovaSenha("NovaSenha123");

    expect(ordem).toEqual(["keypair", "senha", "limpa"]);
  });

  it("o keypair é cifrado com a senha nova", async () => {
    const { ativarE2eComNovaSenha } = await import("./ativar-e2e");

    await ativarE2eComNovaSenha("NovaSenha123");

    expect(generateAndUpload).toHaveBeenCalledWith("NovaSenha123");
  });

  it("troca a senha sem informar a atual (a conta de login social não tem uma)", async () => {
    const { ativarE2eComNovaSenha } = await import("./ativar-e2e");

    await ativarE2eComNovaSenha("NovaSenha123");

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "",
      newPassword: "NovaSenha123",
    });
  });

  it("limpa a sessão local (o backend encerrou a dela) e manda entrar de novo", async () => {
    const { ativarE2eComNovaSenha } = await import("./ativar-e2e");

    await ativarE2eComNovaSenha("NovaSenha123");

    expect(clearSession).toHaveBeenCalled();
    expect(window.location.href).toBe("/entrar?tab=login");
  });
});
