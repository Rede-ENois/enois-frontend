import { useEffect } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { BadgeCheck, Loader2, ShieldQuestion } from "lucide-react";

import { ApiError, identityApi } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Verificação de identidade civil. O estado vem SEMPRE do backend; o botão só existe quando há um
 * provedor autorizado configurado — sem isso, mostramos indisponibilidade em vez de um botão morto.
 */
/**
 * Enquanto a funcionalidade nao estiver pronta/homologada, a secao fica INVISIVEL: nada de UI
 * mostrando "verificacao" sem provedor. Ligue com VITE_IDENTITY_ENABLED=true.
 */
const IDENTITY_UI_ENABLED = import.meta.env.VITE_IDENTITY_ENABLED === "true";

export function IdentityVerificationSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Retorno do provedor: o backend ja aplicou o desfecho; aqui so avisamos e revalidamos.
  useEffect(() => {
    if (!IDENTITY_UI_ENABLED) return;
    const outcome = new URLSearchParams(window.location.search).get("identidade");
    if (outcome === "ok") toast(texts.identity.resultOk);
    else if (outcome === "erro") toast(texts.identity.resultError, "error");
    if (outcome) queryClient.invalidateQueries({ queryKey: ["identity-status"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: status, isLoading } = useQuery({
    queryKey: ["identity-status"],
    queryFn: () => identityApi.status(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["identity-status"] });

  const start = useMutation({
    mutationFn: () => identityApi.start("v1"),
    onSuccess: (result) => {
      invalidate();
      if (result?.redirectUrl) window.location.href = result.redirectUrl;
    },
    onError: (err) =>
      toast(
        err instanceof ApiError && err.code === "IDENTITY_PROVIDER_UNAVAILABLE"
          ? texts.identity.unavailable
          : texts.communities.actionError,
        "error",
      ),
  });

  const refresh = useMutation({
    mutationFn: () => identityApi.refresh(),
    onSuccess: invalidate,
    onError: () => toast(texts.communities.actionError, "error"),
  });

  const revoke = useMutation({
    mutationFn: () => identityApi.revoke(),
    onSuccess: invalidate,
    onError: () => toast(texts.communities.actionError, "error"),
  });

  // Escondida ate a flag ser ligada (tudo implementado, nada visivel).
  if (!IDENTITY_UI_ENABLED) return null;

  const state = status?.state ?? "NOT_VERIFIED";
  const verified = status?.verified ?? false;

  return (
    <section className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldQuestion className="h-5 w-5 text-primary" />

          <h2 className="text-sm font-semibold">{texts.identity.title}</h2>
        </div>

        {verified && (
          <Badge className="gap-1 rounded-full bg-growth/15 text-growth">
            <BadgeCheck className="h-3.5 w-3.5" />
            {texts.identity.badgeLabel}
          </Badge>
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{texts.identity.subtitle}</p>

      <p className="mt-3 text-sm font-medium">{texts.identity.states[state]}</p>

      {verified && status?.provider && (
        <p className="mt-1 text-xs text-muted-foreground">{texts.identity.badgeHint}</p>
      )}

      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <p>{texts.identity.whatWeStore}</p>

        <p>{texts.identity.whoProcesses}</p>
      </div>

      {!status?.providerAvailable && (
        <p className="mt-4 rounded-xl bg-surface-2 p-3 text-xs text-text-subtle">
          {texts.identity.unavailable}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {status?.providerAvailable && !verified && state !== "PENDING" && (
          <Button
            className="rounded-full"
            disabled={isLoading || start.isPending}
            onClick={() => start.mutate()}
          >
            {start.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : texts.identity.start}
          </Button>
        )}

        {state === "PENDING" && status?.providerAvailable && (
          <Button
            variant="outline"
            className="rounded-full"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
          >
            {refresh.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              texts.identity.refresh
            )}
          </Button>
        )}

        {verified && (
          <Button
            variant="outline"
            className="rounded-full text-destructive"
            disabled={revoke.isPending}
            onClick={() => revoke.mutate()}
          >
            {texts.identity.revoke}
          </Button>
        )}
      </div>
    </section>
  );
}
