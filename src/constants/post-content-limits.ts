import type { PostView } from "@/types/application/feed/post-view";

/**
 * Quanto texto cada tipo de post aceita.
 *
 * Espelha o backend (`PostContentLimits`): o campo mostra exatamente o número que o servidor
 * aceita — se aqui dissesse 1200 e o servidor recusasse em 401, a pessoa descobriria o limite
 * depois de escrever.
 *
 * O limite é por tipo porque o tipo é o formato da conversa: diversão é recado curto, tutorial é
 * texto de leitura. Dúvida usa o teto padrão para caber um trecho de código.
 */
const LIMITS: Record<PostView["type"], number> = {
  QUESTION: 1200,
  DIVERTIDO: 400,
  MOMENT: 500,
  // Enquete: o título da enquete (as alternativas têm limite próprio: 120 cada).
  POLL: 400,
  REVIEW: 600,
  PROJECT: 2000,
  NEWS: 2000,
  OPPORTUNITY: 1500,
  TUTORIAL: 5000,
  INSIGHT: 1200,
  PAGE: 1200,
  ARTICLE: 1200,
  // Conteúdo profissional: mesmo teto do backend (PostContentLimits.BUSINESS).
  BUSINESS: 2000,
  BLOG: 1200,
};

export function postContentLimit(type: PostView["type"]): number {
  return LIMITS[type] ?? 1200;
}
