import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GitHubLinkCard as GitHubLinkCardView } from "@rede-enois/design-system/domain";

import { ApiError, authApi, contributorSealsApi } from "@/lib/api";
import { dataEHora } from "@/lib/date/format";

/**
 * Vínculo GitHub usado pelos selos de contribuição. É separado do login social: vincular não
 * altera a forma de entrar nem a verificação de identidade da conta.
 */
export function GitHubLinkCard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me", "github"],
    queryFn: () => contributorSealsApi.githubStatus(),
    retry: false,
  });

  const link = useMutation({
    mutationFn: () => authApi.oauthLinkStart("GITHUB"),
    onSuccess: (start) => {
      window.location.href = start.authorizationUrl;
    },
  });

  const unlink = useMutation({
    mutationFn: () => authApi.oauthUnlink("GITHUB"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "github"] });
      void queryClient.invalidateQueries({ queryKey: ["linked-providers"] });
    },
  });

  const sync = useMutation({
    mutationFn: () => contributorSealsApi.sync(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "github"] });
      void queryClient.invalidateQueries({ queryKey: ["contributors", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["contributor-seals"] });
    },
  });

  return (
    <GitHubLinkCardView
      status={
        data && {
          linked: data.linked,
          login: data.login,
          syncState: data.syncState,
          lastSyncLabel: data.lastSyncedAt ? dataEHora(data.lastSyncedAt) : null,
        }
      }
      loading={isLoading}
      onLink={() => link.mutate()}
      linkPending={link.isPending}
      onUnlink={() => unlink.mutate()}
      unlinkPending={unlink.isPending}
      onSync={() => sync.mutate()}
      syncPending={sync.isPending}
      syncResult={sync.isSuccess ? sync.data : null}
      syncError={sync.isError}
      notConfigured={link.error instanceof ApiError && link.error.code === "OAUTH_NOT_CONFIGURED"}
      error={unlink.error ? "unlink" : link.error ? "link" : null}
      criteriaHref="/selos"
    />
  );
}
