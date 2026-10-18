/**
 * Jogo do Énóis Games.
 *
 * O ciclo de vida (`status`) é da plataforma — enviado, publicado, recusado, suspenso. O `stage` é
 * do PROJETO, declarado pelo criador (em desenvolvimento, demo, acesso antecipado, lançado, pausado)
 * — um jogo publicado pode estar em desenvolvimento sem contradição.
 */
export type GameView = {
  id: string;
  userId: string;
  /** Endereço público: /games/{username}/{slug} — resolvido do perfil pelo backend. */
  username?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  url: string;
  tags?: string | null;
  status: "SUBMITTED" | "PUBLISHED" | "REJECTED" | "SUSPENDED";
  reviewNote?: string | null;
  submittedAt: string;
  shortDescription?: string | null;
  genres: string[];
  languages: string[];
  controls?: string | null;
  requirements?: string | null;
  contentWarnings?: string | null;
  stage: "IN_DEVELOPMENT" | "DEMO" | "EARLY_ACCESS" | "RELEASED" | "PAUSED";
  distribution: "FREE" | "PAID";
  /** Preço em Faíscas. A compra está desligada até as regras comerciais fecharem. */
  priceCoins: number;
  aspect: "WIDESCREEN" | "CLASSIC" | "SQUARE" | "PORTRAIT";
  version?: string | null;
  websiteUrl?: string | null;
  supportUrl?: string | null;
  /** Capturas de tela (ids de mídia do Énóis). */
  mediaIds: string[];
  /** Sessões de jogo contadas pelo SERVIDOR. */
  plays: number;
  favorites: number;
  publishedAt?: string | null;
  /** Se o jogo é de quem está lendo. */
  owned: boolean;
  /** Se quem está lendo guardou na biblioteca. */
  favorited: boolean;
  /** Destaque pago (G2): o jogo sobe no catálogo enquanto ativo. */
  boosted?: boolean;
};
