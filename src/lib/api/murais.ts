import type { CriarMuralInput } from "@/types/application/murais/criar-mural-input";
import type { MuraisContribuicoesPagina } from "@/types/application/murais/murais-contribuicoes-pagina";
import type { MuraisPagina } from "@/types/application/murais/murais-pagina";
import type { MuralContribuicao } from "@/types/application/murais/mural-contribuicao";
import type { MuralResumo } from "@/types/application/murais/mural-resumo";

import { api, buildQuery } from "../api-client";

/**
 * Murais: coleções colaborativas de publicações que já existem no feed. O elo não cria
 * conteúdo — colar aponta um post, que continua com seus comentários, reações e moderação de
 * sempre; tirar do mural nunca apaga o post. O backend manda nas regras; a tela só traduz.
 */
export const muraisApi = {
  list: (cursor?: string | null, limit = 24) =>
    api.get<MuraisPagina>(`/murais${buildQuery({ cursor, limit })}`),

  get: (muralId: string) => api.get<MuralResumo>(`/murais/${encodeURIComponent(muralId)}`),

  create: (data: CriarMuralInput) => api.post<MuralResumo>("/murais", data),

  edit: (muralId: string, data: CriarMuralInput) =>
    api.patch<MuralResumo>(`/murais/${encodeURIComponent(muralId)}`, data),

  remove: (muralId: string) =>
    api.delete<{ removed: boolean }>(`/murais/${encodeURIComponent(muralId)}`),

  contributions: (muralId: string, cursor?: string | null, limit = 24) =>
    api.get<MuraisContribuicoesPagina>(
      `/murais/${encodeURIComponent(muralId)}/contribuicoes${buildQuery({ cursor, limit })}`,
    ),

  /** Cola uma publicação (id ou link — o app extrai o id) e devolve o elo criado. */
  contribute: (muralId: string, postId: string) =>
    api.post<MuralContribuicao>(`/murais/${encodeURIComponent(muralId)}/contribuicoes`, { postId }),

  removeContribution: (muralId: string, postId: string) =>
    api.delete<{ removed: boolean }>(
      `/murais/${encodeURIComponent(muralId)}/contribuicoes/${encodeURIComponent(postId)}`,
    ),
};
