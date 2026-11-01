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

  /** The card lives in a virtualized list, which measures its real height (see the DS prop). */
  virtualized?: boolean;

  /** É o post fixado no topo da comunidade (mostra o selo "Fixado"). */
  pinned?: boolean;

  /** Presente para quem administra a comunidade: mostra o botão de fixar/desafixar. */
  onTogglePin?: () => void;

  pinPending?: boolean;
};
