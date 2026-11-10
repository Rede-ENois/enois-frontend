import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { IdentityReleaseAdminOverview } from "@/types/application/identity/identity-release-admin-overview";
import type { IdentityReleaseRound } from "@/types/application/identity/identity-release-round";
import {
  type IdentityReleaseRound as DSRound,
  type IdentityReleasePolicy,
  IdentityReleaseSection as IdentityReleaseSectionView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { identityApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/** Uma rodada do backend na forma que a visão do design system espera (datas já formatadas). */
function roundView(round: IdentityReleaseRound): DSRound {
  return {
    id: round.id,
    executedAtLabel: dataHora(round.executedAt),
    eligibleCount: round.eligibleCount,
    releasedCount: round.releasedCount,
    minReputation: round.minReputation,
    rankStart: round.rankStart,
    rankEnd: round.rankEnd,
    state: round.state,
    reservedCapacityUsed: round.reservedCapacityUsed,
    note: round.note,
  };
}

/** O payload do backend com os rótulos que a visão espera. */
function overviewView(data: IdentityReleaseAdminOverview) {
  return {
    ...data,
    estimatedSpentUsdLabel: data.estimatedSpentUsd,
    budgetUsdLabel: data.budgetUsd,
    lastRound: data.lastRound ? roundView(data.lastRound) : null,
    policy: {
      ...data.policy,
      nextRoundAtLabel: data.policy.nextRoundAt ? dataHora(data.policy.nextRoundAt) : null,
    },
  };
}

/**
 * Painel da liberação progressiva da verificação de identidade.
 *
 * <p>Container: busca a visão da administração, roda a rodada e salva as réguas. O selo em si não
 * é concedido por aqui — ele só nasce do desfecho confirmado pelo provedor.</p>
 */
export function IdentityReleaseSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["moderator", "identity-release"] });
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["moderator", "identity-release"],
    queryFn: () => identityApi.releaseOverview(),
    retry: false,
  });

  const history = useQuery({
    queryKey: ["moderator", "identity-release", "rounds"],
    queryFn: () => identityApi.releaseRounds(),
    retry: false,
  });

  const save = useMutation({
    mutationFn: (next: Partial<IdentityReleasePolicy>) => identityApi.updateReleaseSettings(next),
    onSuccess: () => {
      toast(texts.moderator.identityRelease.saved, "success");
      invalidate();
    },
    onError: () => toast(texts.moderator.identityRelease.error, "error"),
  });

  const runRound = useMutation({
    mutationFn: () => identityApi.runReleaseRound(),
    onSuccess: (round) => {
      toast(
        round
          ? texts.moderator.identityRelease.roundDone(round.releasedCount, round.eligibleCount)
          : texts.moderator.identityRelease.roundEmpty,
        "success",
      );
      invalidate();
    },
    onError: () => toast(texts.moderator.identityRelease.error, "error"),
  });

  return (
    <IdentityReleaseSectionView
      loading={isLoading}
      error={isError}
      onRefresh={invalidate}
      refreshPending={isLoading}
      onRunRound={() => runRound.mutate()}
      runPending={runRound.isPending}
      onSavePolicy={(next) => save.mutate(next)}
      savePending={save.isPending}
      rounds={(history.data ?? []).map(roundView)}
      overview={data ? overviewView(data) : undefined}
    />
  );
}
