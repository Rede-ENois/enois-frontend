import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import type { ReactionsSummaryProps } from "@/types/components/post/reactions-summary-props";
import { ReactionsSummary as ReactionsSummaryView } from "@rede-enois/design-system/domain";

import { reactionsQueryOptions } from "@/lib/reactions/query-options";
import { usePostReaction } from "@/lib/reactions/use-post-reaction";

/**
 * Resumo compacto (emoji + contagem) das reações de um post — clicável quando o card existe no
 * store (o blog monta o card num efeito do PostActions).
 */
export function ReactionsSummary({ post, initialSummary }: ReactionsSummaryProps) {
  const postId = post.id;
  const card = usePostCardStore((state) => state.cards[postId]);
  // Com o resumo vindo do feed, nada é buscado: o cache só existe depois de reagir ou abrir o
  // diálogo (aí ele manda). Sem resumo (blog, resposta antiga), o card busca como antes.
  const hasInitialSummary = initialSummary != null;
  const { data } = useQuery({ ...reactionsQueryOptions(postId), enabled: !hasInitialSummary });
  const summary = data?.summary ?? initialSummary ?? {};
  const { toggle, isPending } = usePostReaction(postId, post);

  return (
    <ReactionsSummaryView
      summary={summary}
      emojis={REACTION_EMOJIS}
      activeType={post.currentUserReaction ?? null}
      clickable={Boolean(card)}
      // `isPending` é por instância do hook; o flag do store é compartilhado com o
      // PostActions do mesmo post, então as pílulas também bloqueiam a outra instância.
      disabled={card?.reactionPending ?? isPending}
      onToggle={toggle}
    />
  );
}
