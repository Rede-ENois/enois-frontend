import type { EmotePage } from "@/types/application/emote/emote-page";

/**
 * Figurinhas por página: cabe na altura da grade e mantém a rede leve — cada página é uma leva de
 * miniaturas 1x, não a coleção inteira.
 */
export const EMOTES_POR_PAGINA = 40;

/** A página pedida, presa ao intervalo que existe (1 até o total de páginas). */
export function emotePage<T>(itens: T[], pedida: number): EmotePage<T> {
  const totalPages = Math.max(1, Math.ceil(itens.length / EMOTES_POR_PAGINA));
  const pedidaValida = Math.trunc(pedida) || 1;
  const page = Math.min(Math.max(1, pedidaValida), totalPages);
  const inicio = (page - 1) * EMOTES_POR_PAGINA;
  return { items: itens.slice(inicio, inicio + EMOTES_POR_PAGINA), page, totalPages };
}
