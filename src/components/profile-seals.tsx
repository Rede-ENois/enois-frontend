import { useState } from "react";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  ProfileSeals as ProfileSealsView,
  SealEvidenceList as SealEvidenceListView,
} from "@rede-enois/design-system/domain";

import { contributorSealsApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

/**
 * Selos oficiais de contribuição no perfil. Só chegam aqui evidências validadas; notas internas e
 * suspeitas nunca são projetadas pela API pública. O nível exibido já vem calculado do backend.
 */
export function ProfileSeals({ username }: { username: string }) {
  const { data } = useQuery({
    queryKey: ["contributor-seals", username],
    queryFn: () => contributorSealsApi.byUsername(username),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <ProfileSealsView
      seals={(data ?? []).map((seal) => ({ ...seal, grantedAtLabel: dataCurta(seal.grantedAt) }))}
      renderEvidence={(seal) => (
        <SealEvidenceList username={username} category={seal.category} total={seal.evidenceCount} />
      )}
    />
  );
}

/**
 * Evidências paginadas. O cartão conhece o TOTAL (evidenceCount), mas carrega só a página aberta:
 * o perfil não tem mais o teto de 12 — "Carregar mais" busca o resto sob demanda.
 */
function SealEvidenceList({
  username,
  category,
  total,
}: {
  username: string;
  category: string;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  const query = useInfiniteQuery({
    queryKey: ["seal-evidence", username, category],
    queryFn: ({ pageParam }) => contributorSealsApi.evidence(username, category, pageParam, 50),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: open,
  });

  return (
    <SealEvidenceListView
      total={total}
      open={open}
      onOpenChange={setOpen}
      loading={query.isLoading}
      error={query.isError}
      items={query.data?.pages.flatMap((page) => page.items) ?? []}
      hasMore={query.hasNextPage}
      loadingMore={query.isFetchingNextPage}
      onLoadMore={() => void query.fetchNextPage()}
    />
  );
}
