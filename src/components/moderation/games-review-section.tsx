import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { GamesReviewSection as GamesReviewSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { moderationApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

/** Fila de jogos enviados pela comunidade: testar no mesmo quadro isolado e aprovar/recusar. */
export function GamesReviewSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: jogos, isLoading } = useQuery({
    queryKey: ["moderator", "games"],
    queryFn: () => moderationApi.games(30),
    retry: false,
  });

  const decidir = useMutation({
    mutationFn: ({ id, aprovar, note }: { id: string; aprovar: boolean; note?: string }) =>
      aprovar ? moderationApi.approveGame(id, note) : moderationApi.rejectGame(id, note ?? ""),
    onSuccess: (_resposta, vars) => {
      toast(
        vars.aprovar ? texts.moderator.games.approved : texts.moderator.games.rejected,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["moderator", "games"] });
    },
    onError: () => toast(texts.moderator.games.error, "error"),
  });

  const games = (jogos ?? []).map((g) => ({
    ...g,
    submittedAtLabel: g.submittedAt ? dataCurta(g.submittedAt) : null,
  }));

  return (
    <GamesReviewSectionView
      loading={isLoading}
      games={games}
      pending={decidir.isPending}
      onApprove={(id, note) => decidir.mutate({ id, aprovar: true, note })}
      onReject={(id, note) => decidir.mutate({ id, aprovar: false, note })}
    />
  );
}
