import type { ColecaoView } from "@/types/application/games/colecao-view";
import type { DeveloperPage } from "@/types/application/games/developer-page";
import type { GameAnalytics } from "@/types/application/games/game-analytics";
import type { GameCatalogQuery } from "@/types/application/games/game-catalog-query";
import type { GameComment } from "@/types/application/games/game-comment";
import type { GameComments } from "@/types/application/games/game-comments";
import type { GamePage } from "@/types/application/games/game-page";
import type { GameRatingSummary } from "@/types/application/games/game-rating-summary";
import type { GameReview } from "@/types/application/games/game-review";
import type { GameReviews } from "@/types/application/games/game-reviews";
import type { GameStats } from "@/types/application/games/game-stats";
import type { GameUpdateView } from "@/types/application/games/game-update-view";
import type { GameView } from "@/types/application/games/game-view";

import { api, buildQuery } from "../api-client";

/**
 * Énóis Games: o catálogo, a página do criador, a biblioteca e o diário de desenvolvimento.
 *
 * A leitura é pública (jogo e criador são páginas que a pessoa compartilha); escrever exige sessão.
 * O Énóis NÃO hospeda o jogo: o quadro carrega o endereço onde o criador publicou.
 */
export const gamesApi = {
  /** Catálogo público: busca, filtros, ordem e paginação por cursor. */
  catalog: (params: GameCatalogQuery = {}) =>
    api.get<GamePage>(
      `/games${buildQuery({
        query: params.query,
        genre: params.genre,
        tag: params.tag,
        stage: params.stage,
        distribution: params.distribution,
        order: params.order,
        limit: params.limit,
        cursor: params.cursor ?? undefined,
      })}`,
    ),

  /** A página pública do criador (perfil + jogos + quem acompanha). */
  developer: (username: string) =>
    api.get<DeveloperPage>(`/games/${encodeURIComponent(username)}/profile`),

  /** A PRÓPRIA página de criador (o painel preenche o formulário sem saber o @). */
  myDeveloperPage: () => api.get<DeveloperPage>("/games/profile/mine"),

  /** O dono edita a própria página de criador. */
  saveDeveloper: (data: {
    displayName?: string | null;
    headline?: string | null;
    bio?: string | null;
    links?: string | null;
    avatar?: string | null;
    cover?: string | null;
  }) => api.put<DeveloperPage>("/games/profile", data),

  /** Acompanhar o criador (mão única, alterna). */
  follow: (username: string) =>
    api.post<{ following: boolean }>(`/games/${encodeURIComponent(username)}/follow`, {}),

  unfollow: (username: string) =>
    api.delete<{ following: boolean }>(`/games/${encodeURIComponent(username)}/follow`),

  /** Um jogo específico (o dono vê o dele em qualquer estado). */
  bySlug: (username: string, gameSlug: string) =>
    api.get<GameView>(`/games/${encodeURIComponent(username)}/${encodeURIComponent(gameSlug)}`),

  /** Avaliações do jogo (nota 1-5 + texto) e o resumo da nota. */
  reviews: (gameId: string, limit = 30) =>
    api.get<GameReviews>(`/games/${gameId}/reviews?limit=${limit}`),

  submitReview: (gameId: string, rating: number, body?: string) =>
    api.post<GameReview>(`/games/${gameId}/reviews`, { rating, body }),

  deleteReview: (gameId: string) => api.delete<void>(`/games/${gameId}/reviews/mine`),

  /** Nota/comentários em lote para os cards do catálogo. */
  ratings: (ids: string[]) =>
    api.get<Record<string, GameRatingSummary>>(
      `/games/ratings?ids=${encodeURIComponent(ids.join(","))}`,
    ),

  /** Comentários da página do jogo. */
  comments: (gameId: string, limit = 50) =>
    api.get<GameComments>(`/games/${gameId}/comments?limit=${limit}`),

  addComment: (gameId: string, body: string) =>
    api.post<GameComment>(`/games/${gameId}/comments`, { body }),

  deleteComment: (gameId: string, commentId: string) =>
    api.delete<void>(`/games/${gameId}/comments/${commentId}`),

  /** Jogos de quem está logado (todos os status, para acompanhar a moderação). */
  mine: () => api.get<GameView[]>("/me/games"),

  /** A biblioteca de quem está logado (favoritos que continuam publicados). */
  library: () => api.get<GameView[]>("/games/library"),

  /** Guarda/desguarda na biblioteca (alterna). */
  favorite: (gameId: string) =>
    api.post<{ favorited: boolean; favorites: number }>(
      `/games/${encodeURIComponent(gameId)}/favorite`,
      {},
    ),

  unfavorite: (gameId: string) =>
    api.delete<{ favorited: boolean; favorites: number }>(
      `/games/${encodeURIComponent(gameId)}/favorite`,
    ),

  /**
   * Avisa o servidor que alguém começou a jogar. É daqui que sai a contagem de sessões — o front
   * não manda número, só o aviso.
   */
  play: (gameId: string) =>
    api.post<{ plays: number }>(`/games/${encodeURIComponent(gameId)}/play`, {}),

  stats: (gameId: string) => api.get<GameStats>(`/games/${encodeURIComponent(gameId)}/stats`),

  /**
   * Números de uso do jogo (só o criador): totais + série diária de visualizações, partidas,
   * jogadores distintos e compartilhamentos. `days` é a janela (1 a 90).
   */
  analytics: (gameId: string, days = 30) =>
    api.get<GameAnalytics>(`/games/${encodeURIComponent(gameId)}/analytics?days=${days}`),

  /** Tira o jogo da loja (só o dono): novidades, favoritos e histórico vão junto. */
  remove: (gameId: string) =>
    api.delete<{ id: string; status: string }>(`/games/${encodeURIComponent(gameId)}`),

  updates: (gameId: string) =>
    api.get<GameUpdateView[]>(`/games/${encodeURIComponent(gameId)}/updates`),

  /** O dono publica uma novidade (quem acompanha o criador é avisado). */
  publishUpdate: (gameId: string, data: { title: string; body?: string; version?: string }) =>
    api.post<GameUpdateView>(`/games/${encodeURIComponent(gameId)}/updates`, data),

  /** Envia um jogo para moderação. */
  submit: (data: {
    slug?: string;
    title: string;
    description?: string;
    cover?: string;
    url: string;
    tags?: string;
  }) => api.post<{ id: string; slug: string; status: string }>("/games", data),

  /** Edição pelo dono (a ficha inteira). */
  edit: (gameId: string, data: Record<string, unknown>) =>
    api.patch<{ id: string; slug: string; status: string }>(
      `/games/${encodeURIComponent(gameId)}`,
      data,
    ),

  /** Reenvia um jogo recusado para nova rodada de moderação. */
  resubmit: (gameId: string) =>
    api.post<{ id: string; status: string }>(`/games/${encodeURIComponent(gameId)}/resubmit`, {}),
  /** Impulsiona o PRÓPRIO jogo: 5 faíscas por 7 dias no topo do catálogo (G2). */
  boost: (gameId: string) =>
    api.post<{ id: string; boosted: boolean }>(`/games/${encodeURIComponent(gameId)}/boost`, {}),
  /** Identidade DO JOGO: token opaco (15 min, uso único) + pseudônimo — nunca a sessão. */
  identity: (gameId: string) =>
    api.post<{ token: string; expiresAt: string; playerRef: string }>(
      `/games/${encodeURIComponent(gameId)}/identity`,
      {},
    ),
  /** Gasto de faísca confirmado do nosso lado (idempotente pelo requestId do jogo). */
  spend: (gameId: string, amount: number, motivo: string, requestId: string) =>
    api.post<{ status: string; requestId?: string }>(
      `/games/${encodeURIComponent(gameId)}/despesas`,
      {
        amount,
        motivo,
        requestId,
      },
    ),
  /** G-share: publica a conquista no feed com a tag do jogo (o texto vem do jogo, o clique é humano). */
  compartilhar: (gameId: string, texto: string, mediaIds?: string[]) =>
    api.post<{ postId: string; status: string }>(
      `/games/${encodeURIComponent(gameId)}/compartilhar`,
      {
        texto,
        mediaIds: mediaIds ?? [],
      },
    ),
  /** Coleções temáticas curadas (G3) com os jogos resolvidos. */
  colecoes: (limit = 20) => api.get<ColecaoView[]>(`/games/colecoes?limit=${limit}`),

  // --- moderação (fila em /moderacao; a API devolve 403 para quem não decide) ---

  /** Jogos SUBMITTED esperando revisão. */
  pendentes: (limit = 30) => api.get<GameView[]>(`/admin/games?limit=${limit}`),

  aprovar: (gameId: string, note?: string) =>
    api.post<{ id: string; status: string }>(`/admin/games/${encodeURIComponent(gameId)}/approve`, {
      note: note?.trim() || undefined,
    }),

  rejeitar: (gameId: string, note?: string) =>
    api.post<{ id: string; status: string }>(`/admin/games/${encodeURIComponent(gameId)}/reject`, {
      note: note?.trim() || undefined,
    }),
};
