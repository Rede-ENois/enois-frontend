import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DisputesSection as DisputesSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { walletApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";

/**
 * Contestações de transferência: deferir reverte e pune o golpista; rejeitar pune quem contestou
 * de má-fé. O backend decide os dois lados; aqui é só a fila.
 */
export function DisputesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, error, isLoading } = useQuery({
    queryKey: ["coin-disputas"],
    queryFn: () => walletApi.disputasPendentes(30),
    retry: false,
  });

  const decidir = useMutation({
    mutationFn: ({ id, deferir, note }: { id: string; deferir: boolean; note?: string }) =>
      deferir ? walletApi.deferirDisputa(id, note) : walletApi.rejeitarDisputa(id, note),
    onSuccess: (resposta) => {
      toast(
        resposta.state === "UPHELD"
          ? "Contestação deferida: a transferência foi revertida e o valor voltou para a vítima."
          : "Contestação rejeitada: quem contestou foi restringido.",
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["coin-disputas"] });
    },
    onError: () => toast("Não foi possível decidir a contestação.", "error"),
  });

  if (error) return null;

  const disputes = (data ?? []).map((disputa) => ({
    id: disputa.id,
    amountLabel: formatFaisca(disputa.amount),
    reason: disputa.reason,
    createdAtLabel: dataHora(disputa.createdAt),
    entryRef: disputa.entryRef,
  }));

  return (
    <DisputesSectionView
      loading={isLoading}
      disputes={disputes}
      pending={decidir.isPending}
      onUphold={(id) => decidir.mutate({ id, deferir: true })}
      onReject={(id) => decidir.mutate({ id, deferir: false })}
    />
  );
}
