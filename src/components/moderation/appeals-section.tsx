import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { AppealsSection as AppealsSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { sanctionsApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/** Recursos de penalidade automática: aprovar libera; negar converte em banimento. */
export function AppealsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-appeals"],
    queryFn: () => sanctionsApi.pendingAppeals(),
    retry: false,
  });

  const decide = useMutation({
    mutationFn: ({ appealId, deny }: { appealId: string; deny: boolean }) =>
      deny ? sanctionsApi.denyAppeal(appealId) : sanctionsApi.approveAppeal(appealId),
    onSuccess: () => {
      toast(texts.sanctions.decided, "success");
      void queryClient.invalidateQueries({ queryKey: ["pending-appeals"] });
    },
    onError: () => toast(texts.sanctions.moderationError, "error"),
  });

  if (error) return null;

  const appeals = (data ?? []).map((item) => ({
    id: item.id,
    message: item.message,
    createdAtLabel: dataHora(item.createdAt),
  }));

  return (
    <AppealsSectionView
      loading={isLoading}
      appeals={appeals}
      pending={decide.isPending}
      onApprove={(appealId) => decide.mutate({ appealId, deny: false })}
      onDeny={(appealId) => decide.mutate({ appealId, deny: true })}
    />
  );
}
