import type { DeveloperPage } from "@/types/application/games/developer-page";
import type { GameCatalogQuery } from "@/types/application/games/game-catalog-query";
import type { GamePage } from "@/types/application/games/game-page";

export type ColecaoView = {
  id: string;
  title: string;
  description?: string | null;
  jogos: GameView[];
  createdAt: string;
};
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
  /** Coleções temáticas curadas (G3) com os jogos resolvidos. */
  colecoes: (limit = 20) => api.get<ColecaoView[]>(`/games/colecoes?limit=${limit}`),
};
