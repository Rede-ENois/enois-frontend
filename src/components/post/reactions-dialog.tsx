import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { ReactionsDialog as ReactionsDialogView } from "@rede-enois/design-system/domain";

import { profileApi } from "@/lib/api";
import { reactionsQueryOptions } from "@/lib/reactions/query-options";
import { useAuth } from "@/lib/use-auth";

/**
 * Lista quem reagiu ao post, filtrável por tipo.
 *
 * A minha entrada já vem do estado otimista gravado no cache pelo `usePostReaction` — não há mais
 * injeção de reação própria aqui (o hack antigo usava `getCurrentUserId()` e podia duplicar/atrasar
 * em relação ao servidor). O refetch de fim de mutação reconcilia com a verdade do backend.
 */
export function ReactionsDialog({ postId }: PostIdProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const open = usePostCardStore((state) => state.cards[postId]?.showReactions ?? false);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);

  const { data, isLoading, isError } = useQuery({
    ...reactionsQueryOptions(postId),
    enabled: open,
  });

  const reactions = data?.reactions ?? [];

  const uniqueUserIds = [...new Set(reactions.map((r) => r.userId))];
  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", uniqueUserIds.sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => profileApi.getById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((u) => [u!.id, u!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  return (
    <ReactionsDialogView
      open={open}
      onOpenChange={(nextOpen) => setShowReactions(postId, nextOpen)}
      reactions={reactions}
      summary={data?.summary ?? {}}
      users={users}
      currentUserId={currentUserId}
      emojis={REACTION_EMOJIS}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
