import { texts } from "@/texts";

import { ApiError } from "@/lib/api-client";

/**
 * A tela de perfil público profissional tem dois motivos de falha bem diferentes.
 *
 * O 404 é definitivo: o perfil não existe ou está desativado, e a pessoa não tem o que tentar.
 * Qualquer outro erro é de rede/servidor: o perfil pode estar lá, então a mensagem precisa
 * convidar a tentar de novo — e não falar em salvar, porque ninguém estava salvando nada.
 */
export function publicProfileErrorCopy(error: unknown): {
  title: string;
  description: string;
} {
  if (error instanceof ApiError && error.status === 404) {
    return {
      title: texts.corporate.publicProfile.notFoundTitle,
      description: texts.corporate.publicProfile.notFoundBody,
    };
  }

  return {
    title: texts.corporate.publicProfile.loadErrorTitle,
    description: texts.corporate.publicProfile.loadErrorBody,
  };
}
