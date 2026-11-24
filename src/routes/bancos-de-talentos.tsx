import { useMemo, useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { TalentBankDiscovery, useTalentBankSharedFields } from "@rede-enois/design-system/domain";
import type { TalentBankDiscoveryState } from "@rede-enois/design-system/domain";
import { Button } from "@rede-enois/design-system/ui";

import { talentBanksApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { paraResumo } from "@/lib/talent-banks/view-models";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { AppContainer } from "@/components/app-container";

/**
 * A vitrine do Banco de Talentos: as bancas públicas de quem recruta na comunidade.
 *
 * A vitrine mostra a banca e quem a publica — nunca quem se inscreveu. A inscrição é uma decisão
 * de cada pessoa e vive na tela da banca, com o consentimento na mão.
 */
export const Route = createFileRoute("/bancos-de-talentos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.talentBanks.seoTitle }] }),
  component: BancosDeTalentosPage,
});

function BancosDeTalentosPage() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const termo = useDebouncedValue(search, 300);
  const options = useTalentBankSharedFields();

  const banks = useInfiniteQuery({
    queryKey: ["talent-banks", termo, area],
    queryFn: ({ pageParam }) =>
      talentBanksApi.discover({ cursor: pageParam, search: termo, area, limit: 24 }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = useMemo(() => banks.data?.pages.flatMap((page) => page.items) ?? [], [banks.data]);
  const areas = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.focusArea).filter((item): item is string => !!item)),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );

  const state: TalentBankDiscoveryState = banks.isLoading
    ? { kind: "loading" }
    : banks.isError
      ? { kind: "error" }
      : { kind: "ready" };

  return (
    <AppContainer>
      <TalentBankDiscovery
        banks={items.map((bank) => paraResumo(bank, options, `/bancos-de-talentos/${bank.id}`))}
        search={search}
        onSearchChange={setSearch}
        areas={areas}
        area={area}
        onAreaChange={setArea}
        state={state}
        onRetry={() => void banks.refetch()}
      />

      {banks.hasNextPage && (
        <Button
          variant="outline"
          onClick={() => void banks.fetchNextPage()}
          disabled={banks.isFetchingNextPage}
        >
          {texts.talentBanks.loadMore}
        </Button>
      )}
    </AppContainer>
  );
}
