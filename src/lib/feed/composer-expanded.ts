import type { ComposerProgress } from "@/types/lib/feed/composer-progress";

/**
 * Tipos que o compositor desenha em uma linha só. Cada identidade tem o seu: o post de texto
 * comum no feed social (INSIGHT) e o post do feed corporativo (BUSINESS).
 */
const RESTING_POST_TYPES = new Set(["INSIGHT", "BUSINESS"]);

/**
 * Decide se o compositor do feed fica aberto por inteiro.
 *
 * Rascunho, mídia e atalho de abertura contam como trabalho em andamento. O tipo escolhido só
 * conta quando NÃO é o tipo de repouso da identidade — antes, com a identidade profissional, o
 * tipo BUSINESS (que o seletor já aplica sozinho) mantinha o compositor sempre expandido e o
 * launcher nunca aparecia (antes: sempre expandido; agora: descansa até a pessoa começar).
 */
export function composerExpanded({ open, draft, mediaCount, postType }: ComposerProgress): boolean {
  return open || draft.trim() !== "" || mediaCount > 0 || !RESTING_POST_TYPES.has(postType);
}
