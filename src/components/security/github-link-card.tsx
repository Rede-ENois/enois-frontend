import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Button, GithubIcon } from "@rede-enois/design-system/ui";
import { Award, Link2, Link2Off, Loader2, RefreshCw } from "lucide-react";

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

  const error = link.error ?? unlink.error;
  const notConfigured =
    link.error instanceof ApiError && link.error.code === "OAUTH_NOT_CONFIGURED";
  const checkedContributions = (sync.data?.contributions ?? 0) + (sync.data?.issues ?? 0);

  return (
    <section className="surface-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" />

        <h2 className="text-base font-medium">{texts.auth.githubLink.title}</h2>
      </div>

      <p className="text-sm text-muted-foreground">{texts.auth.githubLink.description}</p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-subtle">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : data?.linked ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-soft px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-text-strong">
              <GithubIcon className="h-4 w-4" />
              {texts.auth.githubLink.linkedAs(data.login ?? "")}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              disabled={unlink.isPending}
              onClick={() => {
                if (window.confirm(texts.auth.githubLink.unlinkConfirm)) unlink.mutate();
              }}
            >
              {unlink.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" />
              )}

              <>{texts.auth.githubLink.unlink}</>
            </Button>
          </div>

          <p
            className={
              data.syncState === "ERROR" ? "text-xs text-destructive" : "text-xs text-text-subtle"
            }
          >
            {!data.lastSyncedAt
              ? texts.auth.githubLink.neverSynced
              : data.syncState === "ERROR"
                ? texts.auth.githubLink.syncError
                : data.syncState === "STALE"
                  ? texts.auth.githubLink.syncStale
                  : texts.auth.githubLink.lastSync(dataEHora(data.lastSyncedAt))}
          </p>

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

          {sync.isSuccess && (
            <p
              className={
                sync.data.rateLimited ? "text-xs text-amber-600" : "text-xs text-text-subtle"
              }
            >
              {sync.data.rateLimited
                ? texts.auth.githubLink.syncFailed
                : checkedContributions > 0
                  ? texts.auth.githubLink.syncFound(sync.data.contributions, sync.data.issues)
                  : texts.auth.githubLink.syncEmpty}
            </p>
          )}

          {sync.isError && (
            <p className="text-xs text-destructive">{texts.auth.githubLink.syncFailed}</p>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          disabled={link.isPending}
          onClick={() => link.mutate()}
        >
          {link.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}

          <>{link.isPending ? texts.auth.githubLink.linking : texts.auth.githubLink.link}</>
        </Button>
      )}

      {notConfigured && (
        <p className="text-xs text-amber-600">{texts.auth.githubLink.notConfigured}</p>
      )}

      {error && !notConfigured && (
        <p className="text-xs text-destructive">
          {unlink.error ? texts.auth.githubLink.unlinkError : texts.auth.githubLink.error}
        </p>
      )}

      <Link to="/selos" className="inline-block text-xs font-medium text-primary hover:underline">
        {texts.auth.githubLink.criteria}
      </Link>
    </section>
  );
}
