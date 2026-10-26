import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ContributorContributionStatus } from "@/types/application/seals/contributor-contribution-status";
import type { ContributorSyncReport } from "@/types/application/seals/contributor-sync-report";
import { ListRowSkeletons } from "@rede-enois/design-system/patterns";
import { Button, Textarea } from "@rede-enois/design-system/ui";
import {
  AlertTriangle,
  CheckCircle2,
  GitPullRequest,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import { ApiError, contributorSealsApi } from "@/lib/api";
import { dataEHora } from "@/lib/date/format";
import { cn } from "@/lib/utils";

const FILTERS: (ContributorContributionStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "VALIDATED",
  "REJECTED",
  "CONTESTED",
  "REVOKED",
];

const KINDS = ["ALL", "PULL_REQUEST", "ISSUE"] as const;

/**
 * Fila de evidências do GitHub. O sync só importa; validar é uma decisão humana registrada na
 * auditoria do backend. O frontend nunca concede selo por conta própria.
 */
export function ContributionsSection() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("PENDING");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [report, setReport] = useState<ContributorSyncReport | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "github-contributions", filter, kind],
    queryFn: () =>
      contributorSealsApi.adminContributions(
        filter === "ALL" ? undefined : filter,
        kind === "ALL" ? undefined : kind,
      ),
    retry: false,
  });

  const repositories = useQuery({
    queryKey: ["admin", "github-repositories"],
    queryFn: () => contributorSealsApi.adminRepositories(),
    retry: false,
  });

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContributorContributionStatus }) =>
      contributorSealsApi.adminReview(id, status, notes[id] ?? ""),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "github-contributions"] });
    },
  });

  const sync = useMutation({
    mutationFn: (mode: "incremental" | "dry" | "full") =>
      contributorSealsApi.adminSync({
        dryRun: mode === "dry",
        full: mode === "full",
      }),
    onSuccess: (result) => {
      setReport(result);
      void queryClient.invalidateQueries({ queryKey: ["admin", "github-contributions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "github-repositories"] });
    },
  });

  const toggleRepository = useMutation({
    mutationFn: ({ repository, enabled }: { repository: string; enabled: boolean }) =>
      contributorSealsApi.adminUpdateRepository(repository, enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "github-repositories"] });
    },
  });

  const rows = data ?? [];
  const error = review.error ?? sync.error ?? toggleRepository.error;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
            {texts.moderator.githubContributions.title}
          </h2>

          <p className="text-sm text-muted-foreground">
            {texts.moderator.githubContributions.description}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          aria-label={texts.moderator.githubContributions.refresh}
          title={texts.moderator.githubContributions.refresh}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          disabled={sync.isPending}
          onClick={() => sync.mutate("incremental")}
        >
          {sync.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitPullRequest className="h-4 w-4" />
          )}

          <>
            {sync.isPending
              ? texts.moderator.githubContributions.syncing
              : texts.moderator.githubContributions.sync}
          </>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={sync.isPending}
          onClick={() => sync.mutate("dry")}
        >
          {texts.moderator.githubContributions.syncDryRun}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={sync.isPending}
          onClick={() => sync.mutate("full")}
        >
          {texts.moderator.githubContributions.syncFull}
        </Button>
      </div>

      {report && (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm">
          <p className="font-medium text-text-strong">
            {texts.moderator.githubContributions.syncDone(
              report.created,
              report.updated,
              report.fetched,
              report.issuesCreated,
              report.issuesUpdated,
              report.issuesFetched,
            )}
          </p>

          <p className="mt-1 text-xs text-text-subtle">
            {report.repositories.join(" · ")} · {report.detailsFetched} detalhes ·{" "}
            {report.revertedFlagged} revertidos
          </p>

          {report.rateLimited && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {texts.moderator.githubContributions.rateLimited}
            </p>
          )}

          {report.errors.length > 0 && (
            <p className="mt-1 text-xs text-destructive">{report.errors.join(" · ")}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filter === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border-soft text-text-subtle hover:border-primary/50 hover:text-primary",
            )}
          >
            {id === "ALL"
              ? texts.moderator.githubContributions.filterAll
              : texts.moderator.githubContributions.status[id]}
          </button>
        ))}

        <span className="mx-1 h-6 w-px self-center bg-border-soft" aria-hidden />

        {KINDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              kind === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border-soft text-text-subtle hover:border-primary/50 hover:text-primary",
            )}
          >
            {id === "ALL"
              ? texts.moderator.githubContributions.kindAll
              : texts.moderator.githubContributions.kind[id]}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error instanceof ApiError
            ? error.message
            : texts.moderator.githubContributions.saveError}
        </p>
      )}

      {isLoading ? (
        <ListRowSkeletons />
      ) : isError ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {texts.moderator.githubContributions.error}
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-center text-sm text-text-subtle">
          <GitPullRequest className="mx-auto mb-2 h-6 w-6 text-primary" />

          <>{texts.moderator.githubContributions.empty}</>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((contribution) => {
            const note = notes[contribution.id] ?? "";
            const busy = review.isPending;
            const happenedAt =
              contribution.kind === "ISSUE" ? contribution.closedAt : contribution.mergedAt;
            const labels = (() => {
              if (!contribution.labels) return "";
              try {
                const parsed: unknown = JSON.parse(contribution.labels);
                return Array.isArray(parsed) ? parsed.join(", ") : "";
              } catch {
                return contribution.labels;
              }
            })();

            return (
              <li
                key={contribution.id}
                className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={contribution.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-text-strong hover:text-primary hover:underline"
                    >
                      {contribution.title}
                    </a>

                    <p className="mt-0.5 text-xs text-text-subtle">
                      {texts.moderator.githubContributions.kindLabel[contribution.kind]} ·{" "}
                      {contribution.repository} #{contribution.number}
                      {contribution.username
                        ? ` · @${contribution.username}`
                        : ` · ${texts.moderator.githubContributions.noUser}`}
                      {` · @${contribution.githubLogin}`}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      contribution.status === "VALIDATED"
                        ? "bg-growth/10 text-growth"
                        : contribution.status === "REJECTED" || contribution.status === "REVOKED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary-soft text-primary-text",
                    )}
                  >
                    {texts.moderator.githubContributions.status[contribution.status] ??
                      contribution.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-text-subtle">
                  <span>
                    {contribution.kind === "ISSUE"
                      ? texts.moderator.githubContributions.closedAt
                      : texts.moderator.githubContributions.mergedAt}
                    : {happenedAt ? dataEHora(happenedAt) : "—"}
                  </span>

                  {contribution.kind === "PULL_REQUEST" && (
                    <>
                      <span>
                        {texts.moderator.githubContributions.tests}:{" "}
                        {contribution.hasTests ? "sim" : "não"}
                      </span>

                      <span>{contribution.changedFiles} arquivos</span>

                      <span>
                        +{contribution.additions} / -{contribution.deletions}
                      </span>

                      <span>score {contribution.score}</span>
                    </>
                  )}

                  {labels && (
                    <span>
                      {texts.moderator.githubContributions.labels}: {labels}
                    </span>
                  )}

                  {contribution.reverted && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {texts.moderator.githubContributions.reverted}
                    </span>
                  )}
                </div>

                <Textarea
                  rows={2}
                  value={note}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [contribution.id]: event.target.value }))
                  }
                  placeholder={texts.moderator.githubContributions.reviewNotePlaceholder}
                  maxLength={2000}
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5"
                    disabled={busy || contribution.status === "VALIDATED"}
                    onClick={() => review.mutate({ id: contribution.id, status: "VALIDATED" })}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {texts.moderator.githubContributions.validate}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    disabled={busy || contribution.status === "REJECTED"}
                    onClick={() => review.mutate({ id: contribution.id, status: "REJECTED" })}
                  >
                    <ShieldX className="h-3.5 w-3.5" />
                    {texts.moderator.githubContributions.reject}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={busy || contribution.status === "CONTESTED"}
                    onClick={() => review.mutate({ id: contribution.id, status: "CONTESTED" })}
                  >
                    {texts.moderator.githubContributions.contest}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    disabled={busy || contribution.status === "REVOKED"}
                    onClick={() => review.mutate({ id: contribution.id, status: "REVOKED" })}
                  >
                    {texts.moderator.githubContributions.revokeEvidence}
                  </Button>
                </div>

                {contribution.reviewNote && (
                  <p className="flex items-start gap-1 text-xs text-text-subtle">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {contribution.reviewNote}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2 border-t border-border-soft pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.githubContributions.repositoriesTitle}
        </h3>

        {repositories.data?.map((repository) => (
          <div
            key={repository.repository}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-soft px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs text-text-strong">{repository.repository}</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-subtle">
                {repository.enabled
                  ? texts.moderator.githubContributions.repositoryOn
                  : texts.moderator.githubContributions.repositoryOff}
              </span>

              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={toggleRepository.isPending}
                onClick={() =>
                  toggleRepository.mutate({
                    repository: repository.repository,
                    enabled: !repository.enabled,
                  })
                }
              >
                {repository.enabled ? "Desabilitar" : "Habilitar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
