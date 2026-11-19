import type { PostView } from "@/types/application/feed/post-view";
import type { HomeTab } from "@/types/routes/feed/home-tab";

export type PostCardProps = {
  post: PostView;
  /** Aba do feed de origem, usada para voltar ao mesmo filtro depois de abrir o post. */
  feedTab?: HomeTab;
  /**
   * O card É a página do post (não um item de lista): mostra o texto inteiro e não oferece "Ler
   * mais" — o link levaria para a página em que a pessoa já está, e sem isto o texto completo de um
   * post longo não aparecia em lugar nenhum (a lista corta e a página do post usava o mesmo card).
   */
  fullPost?: boolean;

  /** ID do comentário alvo de uma notificação: rola até ele quando a lista carregar. */
  commento?: string;
  /**
   * Comentário a abrir em destaque (notificação de comentário): a thread rola até a linha e a
   * realça por um instante — o clique leva AO comentário, não ao post (issue #1022).
   */
  highlightCommentId?: string | null;

  /** É o post fixado no topo da comunidade (mostra o selo "Fixado"). */
  pinned?: boolean;

  /** Presente para quem administra a comunidade: mostra o botão de fixar/desafixar. */
  onTogglePin?: () => void;

  pinPending?: boolean;
};
