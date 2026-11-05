import { E2eSetupBanner as E2eSetupBannerView } from "@rede-enois/design-system/domain";

import { ativarE2eComNovaSenha } from "@/lib/e2e/ativar-e2e";
import { generateAndUpload, restoreFromBackup, serverHasKeypair } from "@/lib/e2e/key-manager";

/**
 * Banner no topo do chat quando E2E não está configurado.
 * - Usuário com senha: pede a senha pra gerar/restaurar keypair.
 * - Usuário OAuth sem senha: pede pra definir uma senha primeiro.
 *
 * Se o servidor ja tem keypair, so tenta restaurar — NUNCA gera novo por cima. Gerar novo
 * destruiria as conversation keys cifradas com o keypair anterior e as mensagens antigas
 * ficariam como "Mensagem Cifrada" pra sempre.
 */
export function E2eSetupBanner({
  hasPassword,
  onSetupComplete,
}: {
  hasPassword: boolean;
  onSetupComplete: () => void;
}) {
  const finish = () => {
    onSetupComplete();
    return true;
  };

  const setupWithPassword = async (password: string): Promise<boolean> => {
    const hasServer = await serverHasKeypair();
    if (hasServer) {
      // Servidor tem keypair: restaura. Se falhar, a senha ta errada — nao gera novo.
      return restoreFromBackup(password).then(finish, () => false);
    }
    // Servidor nao tem keypair: primeiro setup de verdade.
    return generateAndUpload(password).then(finish, () => false);
  };

  return (
    <E2eSetupBannerView
      hasPassword={hasPassword}
      onSetupWithPassword={setupWithPassword}
      onDefinePassword={(newPassword) =>
        // A ordem (keypair ANTES da senha) mora em `ativar-e2e.ts`: trocar a senha encerra a
        // sessão, e o upload do keypair depois sairia com 401.
        ativarE2eComNovaSenha(newPassword).then(finish, () => false)
      }
    />
  );
}
