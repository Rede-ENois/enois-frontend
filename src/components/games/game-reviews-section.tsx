import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Star } from "lucide-react";

import { gamesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { UserAvatar } from "@/components/user-avatar";

/** Nota em estrelas; `onPick` ausente = só leitura. */
function Stars({ value, onPick }: { value: number; onPick?: (rating: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(star)}
          className={onPick ? "cursor-pointer" : "cursor-default"}
          aria-label={`${star} estrela${star === 1 ? "" : "s"}`}
          title={`${star} estrela${star === 1 ? "" : "s"}`}
        >
          <Star
            className={`h-4 w-4 ${
              star <= value ? "fill-opportunity text-opportunity" : "text-border"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function GameReviewsSection({ gameId, ownerId }: { gameId: string; ownerId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["game-reviews", gameId],
    queryFn: () => gamesApi.reviews(gameId),
  });

  const myReview = data?.items.find((review) => review.userId === me?.id);
  const isOwner = me?.id === ownerId;

  useEffect(() => {
    if (!myReview) return;
    setRating(myReview.rating);
    setBody(myReview.body ?? "");
    // Só quando a avaliação do usuário chega/muda; incluir o objeto inteiro resetaria o texto
    // enquanto a pessoa digita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id]);

  const save = useMutation({
    mutationFn: () => gamesApi.submitReview(gameId, rating, body.trim() || undefined),
    onSuccess: () => {
      toast(texts.games.game.reviewSaved, "success");
      void queryClient.invalidateQueries({ queryKey: ["game-reviews", gameId] });
    },
    onError: () => toast(texts.games.game.reviewError, "error"),
  });

  const remove = useMutation({
    mutationFn: () => gamesApi.deleteReview(gameId),
    onSuccess: () => {
      setRating(0);
      setBody("");
      toast(texts.games.game.reviewRemoved, "success");
      void queryClient.invalidateQueries({ queryKey: ["game-reviews", gameId] });
    },
    onError: () => toast(texts.games.game.reviewError, "error"),
  });

  return (
    <section className="surface-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium">{texts.games.game.reviewsTitle}</h2>

        {data && data.count > 0 && (
          <span className="text-sm text-text-subtle">
            {texts.games.game.reviewsAverage(data.average, data.count)}
          </span>
        )}
      </div>

      {me && !isOwner && (
        <div className="space-y-2 rounded-2xl border border-border-soft bg-surface-1 p-3">
          <p className="text-sm font-medium text-text-strong">{texts.games.game.reviewYour}</p>

          <Stars value={rating} onPick={setRating} />
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={texts.games.game.reviewBody}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={rating === 0 || save.isPending}
              onClick={() => save.mutate()}
            >
              {myReview ? texts.games.game.reviewUpdate : texts.games.game.reviewSubmit}
            </Button>

            {myReview && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-destructive"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {texts.games.game.reviewRemove}
              </Button>
            )}
          </div>
        </div>
      )}

      {isOwner && <p className="text-sm text-text-subtle">{texts.games.game.reviewOwner}</p>}

      {!me && <p className="text-sm text-text-subtle">{texts.games.game.reviewLogin}</p>}

      {isLoading ? (
        <p className="text-sm text-text-subtle">{texts.common.loading}</p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-text-subtle">{texts.games.game.reviewsEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {data!.items.map((review) => (
            <li key={review.id} className="flex items-start gap-3 border-t border-border-soft pt-3">
              <UserAvatar
                src={review.avatar}
                alt={review.name ?? ""}
                className="h-8 w-8 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-text-strong">
                    {review.name ?? review.username ?? ""}
                  </span>

                  <Stars value={review.rating} />
                </div>

                {review.body && (
                  <p className="mt-1 whitespace-pre-line break-words text-sm text-text-subtle">
                    {review.body}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
