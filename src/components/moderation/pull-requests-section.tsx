import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import {
  type PullRequestData,
  type PullRequestReviewDecision,
  PullRequestsSection as PullRequestsSectionView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { authApi, contributorSealsApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/**
 * Fila de revisão dos PRs abertos dos repositórios oficiais. A revisão vai para o GitHub em nome de
 * quem revisa quando o vínculo tem escrita; sem isso o backend usa o token de serviço.
 */
export function PullRequestsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "github", "pulls"],
    queryFn: () => contributorSealsApi.openPullRequests(),
    retry: false,
    refetchInterval: 60_000,
  });

  const { data: github } = useQuery({
    queryKey: ["me", "github"],
    queryFn: () => contributorSealsApi.githubStatus(),
    retry: false,
  });

  const connectWrite = useMutation({
    mutationFn: () => authApi.oauthWriteLinkStart("GITHUB"),
    onSuccess: (start) => {
      window.location.href = start.authorizationUrl;
    },
    onError: () => toast(texts.moderator.pulls.reviewError, "error"),
  });

  const review = useMutation({
    mutationFn: ({
      pull,
      decision,
      comment,
    }: {
      pull: PullRequestData;
      decision: PullRequestReviewDecision;
      comment?: string;
    }) =>
      contributorSealsApi.reviewPullRequest({
        repository: pull.repository,
        number: pull.number,
        decision,
        comment: decision === "REQUEST_CHANGES" ? comment?.trim() : undefined,
      }),
    onSuccess: (_result, { decision }) => {
      toast(
        decision === "APPROVE"
          ? texts.moderator.pulls.approved
          : texts.moderator.pulls.changesRequested,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["moderator", "github", "pulls"] });
    },
    onError: () => toast(texts.moderator.pulls.reviewError, "error"),
  });

  return (
    <PullRequestsSectionView
      loading={isLoading}
      pulls={(data ?? []).map((pull) => ({
        ...pull,
        updatedAtLabel: pull.updatedAt ? dataHora(pull.updatedAt) : null,
      }))}
      showWriteHint={Boolean(github?.linked && !github.writeAccess)}
      connectWritePending={connectWrite.isPending}
      onConnectWrite={() => connectWrite.mutate()}
      reviewing={
        review.isPending && review.variables
          ? {
              key: `${review.variables.pull.repository}#${review.variables.pull.number}`,
              decision: review.variables.decision,
            }
          : null
      }
      onReview={(pull, decision, comment) =>
        review.mutateAsync({ pull, decision, comment }).then(
          () => true,
          () => false,
        )
      }
    />
  );
}
