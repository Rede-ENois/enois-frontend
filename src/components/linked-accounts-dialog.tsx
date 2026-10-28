import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ENABLED_OAUTH_PROVIDERS,
  OAUTH_PROVIDER_LABELS,
  isOAuthProvider,
  isOAuthProviderEnabled,
} from "@/constants/auth-providers";
import { texts } from "@/texts";
import type { OAuthProvider } from "@/types/application/auth/oauth-provider";
import type { LinkedAccountsDialogProps } from "@/types/components/account/linked-accounts-dialog-props";
import { LinkedAccountsDialog as LinkedAccountsDialogView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, authApi, linkedInIntegrationApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

import { LinkedinImportSection } from "@/components/security/linkedin-import-section";

/**
 * Contas vinculadas: mostra o que já está ligado e permite vincular/desvincular.
 *
 * Só oferece vincular os provedores habilitados (ver ENABLED_OAUTH_PROVIDERS), mas continua
 * listando um provedor desativado que a conta já tenha vinculado — senão ficaria impossível
 * desvincular. Vincular começa um OAuth com state de vinculação (o backend só liga a identidade
 * se o pedido tiver partido de uma conta logada). Desvincular é recusado quando seria o último
 * jeito de entrar.
 */
export function LinkedAccountsDialog({ open, onOpenChange }: LinkedAccountsDialogProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["linked-providers"],
    queryFn: () => authApi.oauthProviders(),
    enabled: open,
  });

  const linked = data ?? [];

  const visibleProviders = [
    ...new Set<string>([...ENABLED_OAUTH_PROVIDERS, ...linked.map((item) => item.provider)]),
  ];

  const unlink = useMutation({
    mutationFn: (provider: string) => authApi.oauthUnlink(provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["linked-providers"] }),
  });

  const link = useMutation({
    mutationFn: (provider: OAuthProvider) => authApi.oauthLinkStart(provider),
    onSuccess: (start) => {
      // No LinkedIn o vínculo pede w_member_social; ao voltar para o feed, a página pergunta se a
      // pessoa quer sincronizar as publicações (ver LinkedInSyncPrompt).
      if (start.provider === "LINKEDIN") localStorage.setItem("linkedin_link_pending", "1");
      window.location.href = start.authorizationUrl;
    },
  });

  const linkedinLinked = linked.some((item) => item.provider === "LINKEDIN");
  const { data: linkedinStatus } = useQuery({
    queryKey: ["linkedin-integration"],
    queryFn: () => linkedInIntegrationApi.status(),
    enabled: open && linkedinLinked,
  });
  const { toast } = useToast();
  const setSync = useMutation({
    mutationFn: (enabled: boolean) => linkedInIntegrationApi.setPostSync(enabled),
    onSuccess: (status) => {
      queryClient.setQueryData(["linkedin-integration"], status);
      toast(texts.auth.links.linkedinSync.saved);
    },
    onError: () => toast(texts.auth.links.linkedinSync.unavailable, "error"),
  });

  // Cada ação tem a sua mensagem: dizer "não foi possível desvincular" quando o clique foi em
  // "Vincular" manda a pessoa procurar um vínculo que não existe (era o que acontecia aqui).
  const unlinkMessage =
    unlink.error instanceof ApiError && unlink.error.code === "LAST_LOGIN_METHOD"
      ? texts.auth.links.lastMethod
      : unlink.error
        ? texts.auth.links.unlinkError
        : null;

  const linkMessage = link.error
    ? link.error instanceof ApiError && link.error.code === "OAUTH_NOT_CONFIGURED"
      ? texts.auth.links.notConfigured(
          link.variables
            ? OAUTH_PROVIDER_LABELS[link.variables]
            : texts.auth.links.providerFallback,
        )
      : texts.auth.links.linkError
    : null;

  return (
    <LinkedAccountsDialogView
      open={open}
      onOpenChange={onOpenChange}
      loading={isLoading}
      providers={visibleProviders.map((provider) => ({
        provider,
        label: isOAuthProvider(provider) ? OAUTH_PROVIDER_LABELS[provider] : provider,
        current: linked.find((item) => item.provider === provider) ?? null,
        linkable: isOAuthProviderEnabled(provider),
      }))}
      busy={unlink.isPending || link.isPending}
      onLink={(provider) => {
        if (isOAuthProviderEnabled(provider)) link.mutate(provider);
      }}
      onUnlink={(provider) => unlink.mutate(provider)}
      errorMessage={unlinkMessage ?? linkMessage}
      linkedinSync={
        linkedinLinked && linkedinStatus
          ? {
              ...linkedinStatus,
              lastShareAtLabel: linkedinStatus.lastShareAt
                ? dataHora(linkedinStatus.lastShareAt)
                : null,
            }
          : null
      }
      syncPending={setSync.isPending}
      onSyncChange={(checked) => setSync.mutate(checked)}
      reconnectPending={link.isPending}
      onReconnect={() => link.mutate("LINKEDIN")}
      importSection={
        <LinkedinImportSection
          linkedinConectado={linked.some((item) => item.provider === "LINKEDIN")}
        />
      }
    />
  );
}
