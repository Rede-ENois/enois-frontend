import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PollView } from "@/types/application/feed/poll-view";
import type { PostView } from "@/types/application/feed/post-view";
import type { EnqueteView } from "@rede-enois/design-system/domain";
import { EnqueteCard } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { feedApi } from "@/lib/api";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import { useAuth } from "@/lib/use-auth";

/** PollView da API -> EnqueteView do design system (mesmo dado, nomes do DS). */
const paraEnquete = (poll: PollView): EnqueteView => ({
  opcoes: poll.options,
  contagens: poll.counts,
  meusVotos: poll.myVotes,
  totalVotos: poll.totalVotes,
  multiplaEscolha: poll.multipleChoice,
  terminaEm: poll.endsAt,
});

/**
 * Enquete no card do feed: o desenho (alternativas, resultado, troca de voto, prazo) é do
 * design system; aqui fica a escrita — votar/trocar, o toast de erro e a atualização do cache.
 * O backend recusa voto depois do prazo com 409 POLL_CLOSED e o card congela no resultado.
 */
export function PollCard({ post }: { post: PostView }) {
  const poll = post.poll;
  const { requireAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // O estado local vence a resposta antiga do feed enquanto a invalidação não chega.
  const [voted, setVoted] = useState<PollView | null>(null);

  const vote = useMutation({
    mutationFn: (corpo: { option?: number; options?: number[] }) =>
      feedApi.votePoll(post.id, corpo),
    onSuccess: (result) => {
      setVoted(result);
      // O voto já voltou na resposta: o cartão recebe o resultado no lugar, sem refazer o feed.
      updatePostInQueryCache(queryClient, post.id, (atual) => ({ ...atual, poll: result }));
    },
    onError: (error) => {
      const fechou = error instanceof Error && /prazo/i.test(error.message);
      toast(fechou ? texts.posts.poll.closedError : texts.posts.poll.error, "error");
      // O prazo bateu em outra aba/dispositivo: recarrega o estado real da enquete.
      if (fechou) queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    },
  });

  if (!poll || poll.options.length === 0) return null;

  return (
    <EnqueteCard
      enquete={paraEnquete(voted ?? poll)}
      pendente={vote.isPending}
      onVotar={(posicao) => {
        if (requireAuth()) vote.mutate({ option: posicao });
      }}
      onVotarMultiplo={(posicoes) => {
        if (requireAuth()) vote.mutate({ options: posicoes });
      }}
    />
  );
}
