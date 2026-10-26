import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { GameReviewsSection as GameReviewsSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { gamesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

export function GameReviewsSection({ gameId, ownerId }: { gameId: string; ownerId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["game-reviews", gameId],
    queryFn: () => gamesApi.reviews(gameId),
  });

  const save = useMutation({
    mutationFn: ({ rating, body }: { rating: number; body: string }) =>
      gamesApi.submitReview(gameId, rating, body.trim() || undefined),
    onSuccess: () => {
      toast(texts.games.game.reviewSaved, "success");
      void queryClient.invalidateQueries({ queryKey: ["game-reviews", gameId] });
    },
    onError: () => toast(texts.games.game.reviewError, "error"),
  });

  const remove = useMutation({
    mutationFn: () => gamesApi.deleteReview(gameId),
    onSuccess: () => {
      toast(texts.games.game.reviewRemoved, "success");
      void queryClient.invalidateQueries({ queryKey: ["game-reviews", gameId] });
    },
    onError: () => toast(texts.games.game.reviewError, "error"),
  });

  return (
    <GameReviewsSectionView
      data={data}
      loading={isLoading}
      viewerId={me?.id ?? null}
      ownerId={ownerId}
      savePending={save.isPending}
      removePending={remove.isPending}
      onSave={(rating, body) => save.mutate({ rating, body })}
      onRemove={async () => {
        await remove.mutateAsync();
      }}
    />
  );
}
