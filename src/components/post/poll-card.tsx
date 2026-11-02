import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PollView } from "@/types/application/feed/poll-view";
import type { PostView } from "@/types/application/feed/post-view";
import { useToast } from "@rede-enois/design-system/ui";
import { Check, Lock } from "lucide-react";

import { feedApi } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

/**
 * Enquete no card: antes do voto são botões (uma alternativa por pessoa); depois do voto vira o
 * resultado com a escolha marcada. O voto é definitivo — o backend recusa o segundo (409) e aqui
 * não existe botão para trocar: depois do primeiro voto a enquete só mostra números.
 */
export function PollCard({ post }: { post: PostView }) {
  const poll = post.poll;
  const { requireAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // O estado local vence a resposta antiga do feed enquanto a invalidação não chega.
  const [voted, setVoted] = useState<PollView | null>(null);
  const current = voted ?? poll;

  const vote = useMutation({
    mutationFn: (option: number) => feedApi.votePoll(post.id, option),
    onSuccess: (result) => {
      setVoted(result);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    },
    onError: (error) => {
      const alreadyVoted = error instanceof Error && /já votou/i.test(error.message);
      toast(alreadyVoted ? texts.posts.poll.alreadyVoted : texts.posts.poll.error, "error");
      // Já votou em outra aba/dispositivo: recarrega o estado real da enquete.
      if (alreadyVoted) queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    },
  });

  if (!current || current.options.length === 0) return null;

  const hasVoted = current.myVote != null;
  const total = current.totalVotes;

  return (
    <div className="mt-3 rounded-2xl border border-border-soft bg-surface-1 p-3">
      <ul className="flex flex-col gap-1.5">
        {current.options.map((option, position) => {
          const count = current.counts[position] ?? 0;
          const percent = total === 0 ? 0 : Math.round((count / total) * 100);
          const mine = current.myVote === position;
          return (
            <li key={`${position}-${option}`}>
              {hasVoted ? (
                <div
                  className={`relative overflow-hidden rounded-xl border px-3 py-2 ${
                    mine ? "border-primary bg-primary/10" : "border-border-soft"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-primary/15"
                    style={{ width: `${percent}%` }}
                  />

                  <div className="relative flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5 text-text-strong">
                      {mine && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}

                      <span className="min-w-0 break-words">{option}</span>
                    </span>

                    <span className="shrink-0 tabular-nums text-text-subtle">
                      {count} · {percent}%
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={vote.isPending}
                  onClick={() => {
                    if (!requireAuth()) return;
                    vote.mutate(position);
                  }}
                  className="w-full rounded-xl border border-border-soft px-3 py-2 text-left text-sm text-text-strong transition hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  {option}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
        <span>{total === 0 ? texts.posts.poll.noVotes : texts.posts.poll.votes(total)}</span>

        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3" aria-hidden="true" />

          {hasVoted ? texts.posts.poll.locked : texts.posts.poll.vote}
        </span>
      </div>
    </div>
  );
}
