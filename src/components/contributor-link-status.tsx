import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ContributorLinkStatus as ContributorLinkStatusView } from "@rede-enois/design-system/domain";

import { contributorSealsApi, contributorsApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

/**
 * Vínculo feito, mas nenhuma contribuição verificada ainda. Mostra o estado e permite verificar
 * de novo — antes a página ficava vazia depois de conectar o GitHub.
 */
export function ContributorLinkStatus() {
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();

  const { data: github } = useQuery({
    queryKey: ["me", "github"],
    queryFn: () => contributorSealsApi.githubStatus(),
    enabled: authenticated,
    retry: false,
  });

  const { data: me } = useQuery({
    queryKey: ["contributors", "me"],
    queryFn: () => contributorsApi.me(),
    enabled: authenticated,
    retry: false,
  });

  const sync = useMutation({
    mutationFn: () => contributorSealsApi.sync(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "github"] });
      void queryClient.invalidateQueries({ queryKey: ["contributors", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["contributor-seals"] });
    },
  });

  if (!authenticated || !github?.linked || me?.verified) return null;

  return (
    <ContributorLinkStatusView
      login={github.login ?? ""}
      syncState={github.syncState}
      syncPending={sync.isPending}
      syncResult={sync.isSuccess ? sync.data : null}
      syncError={sync.isError}
      onSync={() => sync.mutate()}
      securityHref="/seguranca"
    />
  );
}
