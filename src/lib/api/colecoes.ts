import type { ColecaoPost } from "@/types/application/colecoes/colecao-post";
import type { ColecaoResumo } from "@/types/application/colecoes/colecao-resumo";
import type { ColecoesPagina } from "@/types/application/colecoes/colecoes-pagina";
import type { ColecoesPostsPagina } from "@/types/application/colecoes/colecoes-posts-pagina";
import type { CriarColecaoInput } from "@/types/application/colecoes/criar-colecao-input";
import type { MinhasColecoesPagina } from "@/types/application/colecoes/minhas-colecoes-pagina";

import { api, buildQuery } from "../api-client";

/**
 * Coleções pessoais: pastas privadas com os posts que você JÁ salvou. O backend manda nas
 * regras — coleção alheia responde 404, guardar exige o post salvo no perfil e visível; tirar
 * da coleção nunca apaga o post nem o salva. A tela só traduz.
 */
export const colecoesApi = {
  /** `search` filtra no servidor por título e descrição, só entre as suas coleções. */
  list: (cursor?: string | null, search?: string, limit = 24) =>
    api.get<ColecoesPagina>(`/colecoes${buildQuery({ cursor, search, limit })}`),

  get: (colecaoId: string) => api.get<ColecaoResumo>(`/colecoes/${encodeURIComponent(colecaoId)}`),

  create: (data: CriarColecaoInput) => api.post<ColecaoResumo>("/colecoes", data),

  edit: (colecaoId: string, data: CriarColecaoInput) =>
    api.patch<ColecaoResumo>(`/colecoes/${encodeURIComponent(colecaoId)}`, data),

  remove: (colecaoId: string) =>
    api.delete<{ removed: boolean }>(`/colecoes/${encodeURIComponent(colecaoId)}`),

  /**
   * As minhas coleções na ótica de um post — alimenta o seletor "guardar em coleção" do card.
   * `tem` diz se o post já está guardado; guardar uma coleção nova pede o post salvo antes.
   */
  minhas: (postId: string) =>
    api.get<MinhasColecoesPagina>(`/colecoes/minhas${buildQuery({ postId })}`),

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
