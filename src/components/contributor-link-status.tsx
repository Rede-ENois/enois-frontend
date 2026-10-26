import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Button, GithubIcon } from "@rede-enois/design-system/ui";
import { Loader2, RefreshCw } from "lucide-react";

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

  const checked = (sync.data?.contributions ?? 0) + (sync.data?.issues ?? 0);

  return (
    <section className="surface-card space-y-3 p-5">
      <div className="flex items-center gap-2">
        <GithubIcon className="h-4 w-4 text-primary" aria-hidden />

        <h2 className="text-base font-semibold tracking-tight">{texts.sealsPage.pendingTitle}</h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {texts.sealsPage.pendingDescription(github.login ?? "")}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5"
          disabled={sync.isPending}
          onClick={() => sync.mutate()}
        >
          {sync.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}

          <>{sync.isPending ? texts.auth.githubLink.syncing : texts.auth.githubLink.syncNow}</>
        </Button>

        <Link to="/seguranca" className="text-xs font-medium text-primary hover:underline">
          {texts.auth.githubLink.title}
        </Link>
      </div>

      {github.syncState === "ERROR" && (
        <p className="text-xs text-destructive">{texts.sealsPage.pendingError}</p>
      )}

      {sync.isSuccess && (
        <p
          className={sync.data.rateLimited ? "text-xs text-amber-600" : "text-xs text-text-subtle"}
        >
          {sync.data.rateLimited
            ? texts.auth.githubLink.syncFailed
            : checked > 0
              ? texts.auth.githubLink.syncFound(sync.data.contributions, sync.data.issues)
              : texts.auth.githubLink.syncEmpty}
        </p>
      )}

      {sync.isError && (
        <p className="text-xs text-destructive">{texts.auth.githubLink.syncFailed}</p>
      )}
    </section>
  );
}
