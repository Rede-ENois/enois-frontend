/**
 * Uma pessoa na lista pública de "quem acabou de chegar".
 *
 * A lista é por ORDEM DE CHEGADA (mais recentes primeiro), não por reputação — a reputação
 * continua no perfil, mas não ordena nem descreve esta lista.
 */
import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type RankingUser = {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  reputation: number;
  /** Quando a conta chegou na plataforma (ISO); nulo em perfis antigos sem data. */
  joinedAt: string | null;
  /** Personalização do nome (tema/fonte/cor); ausente = padrão. */
  nameTheme?: AuthorNameStyle["theme"];
  nameFont?: AuthorNameStyle["font"];
  nameColor?: string | null;
  /** Equipped nameplate (`placa-*`); the list is the public profile view, so it carries it. */
  nameplate?: string | null;
};
