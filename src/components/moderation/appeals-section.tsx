import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, EmptyState, useToast } from "@rede-enois/design-system/ui";
import { Gavel } from "lucide-react";

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

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
        {texts.sanctions.moderationTitle}
      </h2>

      <p className="text-sm text-muted-foreground">{texts.sanctions.moderationDescription}</p>

      {isLoading ? (
        <ListRowSkeletons />
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card">
          <EmptyState icon={Gavel} title={texts.sanctions.moderationEmpty} />
        </div>
      ) : (
        <ul className="space-y-3">
          {data!.map((item) => (
            <li
              key={item.id}
              className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4"
            >
              <p className="text-sm">{item.message}</p>

              <p className="text-xs text-text-subtle">{dataHora(item.createdAt)}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ appealId: item.id, deny: false })}
                >
                  {texts.sanctions.approve}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ appealId: item.id, deny: true })}
                >
                  {texts.sanctions.deny}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
