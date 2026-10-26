import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { GameCommentsSection as GameCommentsSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { gamesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

export function GameCommentsSection({ gameId, ownerId }: { gameId: string; ownerId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["game-comments", gameId],
    queryFn: () => gamesApi.comments(gameId),
  });

  const add = useMutation({
    mutationFn: (body: string) => gamesApi.addComment(gameId, body),
    onSuccess: () => {
      toast(texts.games.game.commentSaved, "success");
      void queryClient.invalidateQueries({ queryKey: ["game-comments", gameId] });
    },
    onError: () => toast(texts.games.game.commentError, "error"),
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => gamesApi.deleteComment(gameId, commentId),
    onSuccess: () => {
      toast(texts.games.game.commentRemoved, "success");
      void queryClient.invalidateQueries({ queryKey: ["game-comments", gameId] });
    },
    onError: () => toast(texts.games.game.commentError, "error"),
  });

  return (
    <GameCommentsSectionView
      data={data}
      loading={isLoading}
      viewerId={me?.id ?? null}
      ownerId={ownerId}
      addPending={add.isPending}
      onAdd={async (body) => {
        await add.mutateAsync(body);
      }}
      onRemove={(commentId) => remove.mutate(commentId)}
    />
  );
}
