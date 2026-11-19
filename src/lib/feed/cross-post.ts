import { texts } from "@/texts";

import { ApiError } from "@/lib/api-client";

/**
 * Tipos que uma conta pessoal pode mandar também para o feed profissional (#723, item 3). A
 * publicação continua sendo uma só: quem a assina passa a ser o perfil profissional do autor, e o
 * feed corporativo lista estas publicações junto das BUSINESS.
 */
export const FEED_CROSS_POST_TYPES = ["INSIGHT", "PROJECT", "OPPORTUNITY", "TUTORIAL", "ARTICLE"];

/** O tipo entra no feed profissional quando a pessoa marcou replicar e hoje quem posta é o perfil pessoal. */
export function crossPostsToCorporate(type: string, crossPost: boolean): boolean {
  return crossPost && FEED_CROSS_POST_TYPES.includes(type);
}

/**
 * O backend recusa publicar como profissional de quem não tem o perfil ativo. Replicando, o erro
 * fala disso — não do post —, e a publicação segue no feed social quando a pessoa desmarca.
 */
export function crossPostFailureMessage(error: unknown): string | null {
  return error instanceof ApiError && error.code === "NO_ACTIVE_CORPORATE_PROFILE"
    ? texts.feed.composer.crossPost.noProfile
    : null;
}
