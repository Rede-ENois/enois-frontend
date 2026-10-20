import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Trash2 } from "lucide-react";

import { gamesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { UserAvatar } from "@/components/user-avatar";

export function GameCommentsSection({ gameId, ownerId }: { gameId: string; ownerId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const [body, setBody] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["game-comments", gameId],
    queryFn: () => gamesApi.comments(gameId),
  });

  const add = useMutation({
    mutationFn: () => gamesApi.addComment(gameId, body.trim()),
    onSuccess: () => {
      setBody("");
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
    <section className="surface-card space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">{texts.games.game.commentsTitle}</h2>

        {data && <span className="text-sm text-text-subtle">{data.count}</span>}
      </div>

      {me ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder={texts.games.game.commentPlaceholder}
          />

          <Button
            size="sm"
            className="rounded-full"
            disabled={body.trim().length < 2 || add.isPending}
            onClick={() => add.mutate()}
          >
            {texts.games.game.commentSubmit}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-text-subtle">{texts.games.game.commentLogin}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-text-subtle">{texts.common.loading}</p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-text-subtle">{texts.games.game.commentsEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {data!.items.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start gap-3 border-t border-border-soft pt-3"
            >
              <UserAvatar
                src={comment.avatar}
                alt={comment.name ?? ""}
                className="h-8 w-8 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-strong">
                    {comment.name ?? comment.username ?? ""}
                  </span>

                  {(comment.userId === me?.id || me?.id === ownerId) && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(comment.id)}
                      className="inline-flex items-center gap-1 text-xs text-text-subtle hover:text-destructive"
                      aria-label={texts.games.game.commentDelete}
                    >
                      <Trash2 className="h-3 w-3" />

                      <>{texts.games.game.commentDelete}</>
                    </button>
                  )}
                </div>

                <p className="mt-1 whitespace-pre-line break-words text-sm text-text-subtle">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
