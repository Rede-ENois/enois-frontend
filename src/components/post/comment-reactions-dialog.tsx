import { useQueries, useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { CommentReactionsDialogProps } from "@/types/components/post/comment-reactions-dialog-props";
import { ReactionsDialog as ReactionsDialogView } from "@rede-enois/design-system/domain";

import { reactionsApi } from "@/lib/api";
import { profileQueries } from "@/lib/query-options/profiles";
import { useAuth } from "@/lib/use-auth";

/**
 * Quem reagiu a um comentário, filtrável por tipo — o mesmo diálogo que o post abre pelo
 * contador de reações. Uma query por comentário aberto, nunca por comentário da lista.
 */
export function CommentReactionsDialog({
  postId,
  commentId,
  open,
  onOpenChange,
}: CommentReactionsDialogProps) {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["comment-reactions", commentId],
    queryFn: () => reactionsApi.listCommentReactions(postId, commentId),
    enabled: open,
  });

  const reactions = data?.reactions ?? [];

  // Um perfil que falhar ao carregar só fica de fora do mapa: não derruba a lista inteira.
  const uniqueUserIds = [...new Set(reactions.map((r) => r.userId))];
  const profiles = useQueries({
    queries: uniqueUserIds.map((id) => ({
      ...profileQueries.byId(id),
      enabled: open,
      retry: false,
    })),
  });
  const users = Object.fromEntries(
    profiles.flatMap((query) => (query.data ? [[query.data.id, query.data]] : [])),
  );

  return (
    <ReactionsDialogView
      open={open}
      onOpenChange={onOpenChange}
      reactions={reactions}
      summary={data?.summary ?? {}}
      users={users}
      currentUserId={user?.id ?? null}
      emojis={REACTION_EMOJIS}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
