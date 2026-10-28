import { useEffect } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { IdentityVerificationSection as IdentityVerificationSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, identityApi } from "@/lib/api";

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

  return (
    <IdentityVerificationSectionView
      status={status}
      loading={isLoading}
      onStart={() => start.mutate()}
      startPending={start.isPending}
      onRefresh={() => refresh.mutate()}
      refreshPending={refresh.isPending}
      onRevoke={() => revoke.mutate()}
      revokePending={revoke.isPending}
    />
  );
}
