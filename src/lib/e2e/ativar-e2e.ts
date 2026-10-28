import { clearSession } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

import { generateAndUpload } from "./key-manager";

/**
 * Ativa a criptografia ponta a ponta para quem ainda NÃO tem senha (conta de login social).
 *
 * A ordem aqui é o que faz o fluxo funcionar:
 *
 * 1. **primeiro** o keypair é gerado, cifrado com a senha nova e guardado (no servidor e no
 *    aparelho);
 * 2. **depois** a senha é definida.
 *
 * Trocar a senha ENCERRA todas as sessões da conta — inclusive a que está em uso
 * (`AuthService.changePassword` → `revokeAllByUser`). Na ordem antiga (senha, depois keypair) o
 * upload do keypair saía com a sessão morta: `POST /e2e/keypair` respondia **401**, o banner
 * caía em "Não foi possível definir a senha" e a pessoa ficava sem chave E sem erro claro —
 * pior: a senha já tinha sido trocada, então na volta ao login o banner aparecia de novo e o
 * E2E não podia ser ativado.
 *
 * Confirmado no backend (2026-10-28): `POST /auth/password/change` → 200 e a sessão seguinte
 * responde 401; `POST /e2e/keypair` com a sessão morta também é 401.
 *
 * E, como a troca derruba a sessão, a pessoa entra de novo com a senha nova — o mesmo que
 * acontece em qualquer troca de senha do app (`change-password-dialog`). A chave E2E já está
 * guardada (no aparelho e no servidor), então o chat volta a funcionar depois do login.
 */
export async function ativarE2eComNovaSenha(novaSenha: string): Promise<void> {
  // Com a sessão viva: o keypair sobe.
  await generateAndUpload(novaSenha);

  // A troca de senha encerra a sessão — por isso ela vem depois do upload.
  await authApi.changePassword({ currentPassword: "", newPassword: novaSenha });

  // A sessão foi encerrada pelo backend: limpa a local e manda entrar com a senha nova.
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/entrar?tab=login";
  }
}
