import type { HomeTab } from "@/types/routes/feed/home-tab";

/**
 * Destino do botão de voltar do post único. Post de comunidade volta para a própria comunidade;
 * post sem comunidade volta para o feed, preservando a aba de origem.
 */
export type PostBackTarget =
  { to: "/comunidades/$communityId"; communityId: string } | { to: "/feed"; feedTab?: HomeTab };
