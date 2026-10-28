import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ContributorContributionStatus } from "@/types/application/seals/contributor-contribution-status";
import type { ContributorSyncReport } from "@/types/application/seals/contributor-sync-report";
import { ContributionsSection as ContributionsSectionView } from "@rede-enois/design-system/domain";

import { ApiError, contributorSealsApi } from "@/lib/api";
import { dataEHora } from "@/lib/date/format";

/**
 * Fila de evidências do GitHub. O sync só importa; validar é uma decisão humana registrada na
 * auditoria do backend. O frontend nunca concede selo por conta própria.
 */
export function ContributionsSection() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ContributorContributionStatus | "ALL">("PENDING");
  const [kind, setKind] = useState<"ALL" | "PULL_REQUEST" | "ISSUE">("ALL");
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
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: ContributorContributionStatus;
      note: string;
    }) => contributorSealsApi.adminReview(id, status, note),
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

  const error = review.error ?? sync.error ?? toggleRepository.error;

  return (
    <ContributionsSectionView
      filter={filter}
      onFilterChange={(value) => setFilter(value as ContributorContributionStatus | "ALL")}
      kind={kind}
      onKindChange={(value) => setKind(value as "ALL" | "PULL_REQUEST" | "ISSUE")}
      loading={isLoading}
      loadError={isError}
      fetching={isFetching}
      onRefresh={() => void refetch()}
      contributions={(data ?? []).map((contribution) => {
        const happenedAt =
          contribution.kind === "ISSUE" ? contribution.closedAt : contribution.mergedAt;
        return { ...contribution, happenedAtLabel: happenedAt ? dataEHora(happenedAt) : null };
      })}
      reviewPending={review.isPending}
      onReview={(id, status, note) =>
        review.mutate({ id, status: status as ContributorContributionStatus, note })
      }
      syncPending={sync.isPending}
      onSync={(mode) => sync.mutate(mode)}
      report={report}
      repositories={repositories.data ?? []}
      repositoryPending={toggleRepository.isPending}
      onToggleRepository={(repository, enabled) => toggleRepository.mutate({ repository, enabled })}
      actionError={Boolean(error)}
      actionErrorMessage={error instanceof ApiError ? error.message : null}
    />
  );
}
