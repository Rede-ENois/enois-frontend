import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PollView } from "@/types/application/feed/poll-view";
import type { PostView } from "@/types/application/feed/post-view";
import { useToast } from "@rede-enois/design-system/ui";
import { Check, Lock, Repeat } from "lucide-react";

import { feedApi } from "@/lib/api";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import { useAuth } from "@/lib/use-auth";

import { RichText } from "./rich-text";

/**
 * Enquete no card: cada alternativa é um botão, antes e depois do voto. O primeiro voto registra;
 * clicar em outra alternativa de depois TROCA o voto (o backend move a linha — um voto por pessoa,
 * a unique garante), e repetir a mesma não muda nada (idempotente). A escolha fica marcada e a
 * barra mostra o resultado corrente.
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
      // O voto já voltou na resposta: o cartão recebe o resultado no lugar, sem refazer o feed.
      updatePostInQueryCache(queryClient, post.id, (current) => ({ ...current, poll: result }));
    },
    onError: (error) => {
      const alreadyVoted = error instanceof Error && /já votou/i.test(error.message);
      // 409 hoje só acontece na corrida de duas requisições da mesma pessoa ao mesmo tempo.
      toast(alreadyVoted ? texts.posts.poll.alreadyVoted : texts.posts.poll.error, "error");
      // Recarrega o estado real da enquete: com ele na tela, trocar o voto funciona de novo.
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
              <button
                type="button"
                disabled={vote.isPending}
                aria-pressed={hasVoted ? mine : undefined}
                onClick={() => {
                  if (!requireAuth()) return;
                  vote.mutate(position);
                }}
                className={`relative block w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-sm text-text-strong transition hover:border-primary hover:text-primary disabled:opacity-60 ${
                  mine ? "border-primary bg-primary/10" : "border-border-soft"
                }`}
              >
                {hasVoted && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-primary/15"
                    style={{ width: `${percent}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {mine && hasVoted && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}

                    {/* A alternativa passa pelo RichText: figurinha no código (`:KEKW:`) vira
                        imagem, igual no resto do texto. O squash do voto-mutável trouxe a versão
                        de antes do RichText e desfez isso sem conflito aparente. */}
                    <RichText content={option} className="min-w-0" />
                  </span>

                  {hasVoted && (
                    <span className="shrink-0 tabular-nums text-text-subtle">
                      {count} · {percent}%
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
        <span>{total === 0 ? texts.posts.poll.noVotes : texts.posts.poll.votes(total)}</span>

        <span className="inline-flex items-center gap-1">
          {hasVoted ? (
            <>
              <Repeat className="h-3 w-3" aria-hidden="true" />

              {texts.posts.poll.changeHint}
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" aria-hidden="true" />

              {texts.posts.poll.vote}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
