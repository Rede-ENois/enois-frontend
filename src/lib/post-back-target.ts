import type { PostBackTarget } from "@/types/application/feed/post-back-target";
import type { PostView } from "@/types/application/feed/post-view";
import type { HomeTab } from "@/types/routes/feed/home-tab";

/**
 * O voltar do post único: post de comunidade volta para a própria comunidade — destino fixo, não o
 * histórico do navegador, que com link compartilhado ou reload jogava no feed inicial (ou fora do
 * app). Sem comunidade, mantém o voltar de sempre.
 */
export function backTargetOf(
  post: Pick<PostView, "community"> | null | undefined,
  feedTab?: HomeTab,
): PostBackTarget {
  if (post?.community) return { to: "/comunidades/$communityId", communityId: post.community.id };
  return { to: "/feed", ...(feedTab ? { feedTab } : {}) };
}
