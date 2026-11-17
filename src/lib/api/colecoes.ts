import type { ColecaoPost } from "@/types/application/colecoes/colecao-post";
import type { ColecaoResumo } from "@/types/application/colecoes/colecao-resumo";
import type { ColecoesPagina } from "@/types/application/colecoes/colecoes-pagina";
import type { ColecoesPostsPagina } from "@/types/application/colecoes/colecoes-posts-pagina";
import type { CriarColecaoInput } from "@/types/application/colecoes/criar-colecao-input";

import { api, buildQuery } from "../api-client";

/**
 * Coleções pessoais: pastas privadas com os posts que você JÁ salvou. O backend manda nas
 * regras — coleção alheia responde 404, guardar exige o post salvo no perfil e visível; tirar
 * da coleção nunca apaga o post nem o salva. A tela só traduz.
 */
export const colecoesApi = {
  list: (cursor?: string | null, limit = 24) =>
    api.get<ColecoesPagina>(`/colecoes${buildQuery({ cursor, limit })}`),

  get: (colecaoId: string) => api.get<ColecaoResumo>(`/colecoes/${encodeURIComponent(colecaoId)}`),

  create: (data: CriarColecaoInput) => api.post<ColecaoResumo>("/colecoes", data),

  edit: (colecaoId: string, data: CriarColecaoInput) =>
    api.patch<ColecaoResumo>(`/colecoes/${encodeURIComponent(colecaoId)}`, data),

  remove: (colecaoId: string) =>
    api.delete<{ removed: boolean }>(`/colecoes/${encodeURIComponent(colecaoId)}`),

  posts: (colecaoId: string, cursor?: string | null, limit = 24) =>
    api.get<ColecoesPostsPagina>(
      `/colecoes/${encodeURIComponent(colecaoId)}/posts${buildQuery({ cursor, limit })}`,
    ),

  /** Guarda um post salvo (id ou link — o app extrai o id) e devolve o elo criado. */
  addPost: (colecaoId: string, postId: string) =>
    api.post<ColecaoPost>(`/colecoes/${encodeURIComponent(colecaoId)}/posts`, { postId }),

  removePost: (colecaoId: string, postId: string) =>
    api.delete<{ removed: boolean }>(
      `/colecoes/${encodeURIComponent(colecaoId)}/posts/${encodeURIComponent(postId)}`,
    ),
};
