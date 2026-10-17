import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, Gavel } from "lucide-react";

import { sanctionsApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";

/**
 * Fila de recursos das penalidades automaticas. Somente administradores (REDE_ADMIN_EMAILS)
 * conseguem de fato decidir — para os demais a API devolve 403 e a pagina avisa.
 */
export const Route = createFileRoute("/moderacao")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({ title: texts.sanctions.moderationTitle, path: "/moderacao" }),
  }),
  component: Moderacao,
});

function Moderacao() {
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

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.sanctions.back}</>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{texts.sanctions.moderationTitle}</h1>

          <p className="text-sm text-muted-foreground">{texts.sanctions.moderationDescription}</p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-text-subtle">
            {texts.sanctions.moderationError}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={Gavel} title={texts.sanctions.moderationEmpty} />
          </div>
        ) : (
          <ul className="space-y-3">
            {data!.map((item) => (
              <li key={item.id} className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4">
                <p className="text-sm">{item.message}</p>

                <p className="text-xs text-text-subtle">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>

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
      </div>
    </AppContainer>
  );
}
