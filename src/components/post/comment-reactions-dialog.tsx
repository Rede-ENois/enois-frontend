import { useQuery } from "@tanstack/react-query";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { CommentReactionsDialogProps } from "@/types/components/post/comment-reactions-dialog-props";
import { ReactionsDialog as ReactionsDialogView } from "@rede-enois/design-system/domain";

import { profileApi, reactionsApi } from "@/lib/api";
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
