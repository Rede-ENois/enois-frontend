import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ContributorAdminView } from "@/types/application/contributors/contributor-admin-view";
import type { ContributorApplicationStatus } from "@/types/application/contributors/contributor-application-status";
import {
  ContributorCard as ContributorCardView,
  ContributorsSection as ContributorsSectionView,
} from "@rede-enois/design-system/domain";

import { contributorsApi } from "@/lib/api";
import { dataCurta, dataHora } from "@/lib/date/format";

/**
 * Painel de contribuintes.
 *
 * Quem tem contribuição verificada aparece sozinho, já aprovado pelo GitHub; o formulário da
 * landing serve só para confirmar os dados (sem triagem). Candidaturas da landing continuam na
 * fila manual (nova → análise → aprovar/recusar).
 */
export function ContributorsSection() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["moderator", "contributors"],
    queryFn: () => contributorsApi.adminPanel(),
    retry: false,
  });

  const rows = data ?? [];

  return (
    <ContributorsSectionView
      loading={isLoading}
      error={isError}
      fetching={isFetching}
      empty={rows.length === 0}
      onRefresh={() => void refetch()}
    >
      {rows.map((application) => (
        <ContributorCard
          key={application.id ?? application.userId ?? application.github}
          application={application}
        />
      ))}
    </ContributorsSectionView>
  );
}

function ContributorCard({ application }: { application: ContributorAdminView }) {
  const queryClient = useQueryClient();

  const setStatus = useMutation({
    // A view só oferece as ações quando há candidatura (id não nulo) e ela não veio do GitHub.
    mutationFn: (status: ContributorApplicationStatus) =>
      contributorsApi.adminUpdateStatus(application.id!, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["moderator", "contributors"] });
    },
  });

  return (
    <ContributorCardView
      application={{
        ...application,
        githubVerified: application.source === "GITHUB_VERIFIED",
        createdAtLabel: dataHora(application.createdAt),
        acceptedTermsAtLabel: application.acceptedTermsAt
          ? dataCurta(application.acceptedTermsAt)
          : null,
      }}
      pending={setStatus.isPending}
      saveError={setStatus.isError}
      onReview={() => setStatus.mutate("REVIEWING")}
      onApprove={() => setStatus.mutate("APPROVED")}
      onReject={() => setStatus.mutate("REJECTED")}
    />
  );
}
