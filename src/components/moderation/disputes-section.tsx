import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, useToast } from "@rede-enois/design-system/ui";
import { ShieldAlert } from "lucide-react";

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

  return (
    <section className="space-y-3" aria-label="Contestações de transferência">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary" />

        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          Contestações de transferência
        </h2>
      </div>

      {isLoading ? (
        <ListRowSkeletons />
      ) : (data?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          Nenhuma contestação esperando decisão.
        </p>
      ) : (
        <ul className="space-y-3">
          {data!.map((disputa) => (
            <li
              key={disputa.id}
              className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4"
            >
              <p className="text-sm font-semibold">
                Transferência de {formatFaisca(disputa.amount)} faíscas · motivo: {disputa.reason}
              </p>

              <p className="text-xs text-text-subtle">
                {dataHora(disputa.createdAt)} · ref {disputa.entryRef.slice(0, 16)}…
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={decidir.isPending}
                  onClick={() => decidir.mutate({ id: disputa.id, deferir: true })}
                >
                  Procede (reverter)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={decidir.isPending}
                  onClick={() => decidir.mutate({ id: disputa.id, deferir: false })}
                >
                  Não procede (punir contestador)
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
