import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, createFileRoute, useMatchRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Campaign } from "@/types/application/roleplay/campaign";
import type { GameSystem } from "@/types/application/roleplay/game-system";
import type { RoleplayCampaignData } from "@rede-enois/design-system/domain";
import type { RoleplayCreateCampaignValues } from "@rede-enois/design-system/domain";
import type { RoleplayDirectoryProps } from "@rede-enois/design-system/domain";
import { RoleplayDirectory } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { roleplayApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/roleplay")({
  head: () => ({ meta: [{ title: texts.roleplay.seoTitle }] }),
  component: Roleplay,
});

/**
 * Éroleplay: a lista de campanhas da rede. A descoberta é pública; a escrita pede sessão.
 * O design system desenha; este contêiner só busca, corta e navega. Este arquivo é o pai de
 * /roleplay/$slug: quando há campanha na URL, quem responde é o filho.
 */
function Roleplay() {
  const [query, setQuery] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const matchRoute = useMatchRoute();
  const isDetail = matchRoute({ to: "/roleplay/$slug" });

  const {
    data: mineData,
    isLoading: isMineLoading,
    isError: isMineError,
  } = useQuery({
    queryKey: ["roleplay", "mine"],
    queryFn: () => roleplayApi.mine(),
    enabled: !isDetail && authenticated,
  });

  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    refetch,
  } = useQuery({
    queryKey: ["roleplay", "list", query],
    queryFn: () => roleplayApi.list({ query: query.trim() || undefined }),
    enabled: !isDetail,
  });

  const { data: systemsData } = useQuery({
    queryKey: ["roleplay", "systems"],
    queryFn: () => roleplayApi.systems(),
    enabled: !isDetail,
  });

  const create = useMutation({
    mutationFn: (values: RoleplayCreateCampaignValues) => {
      const chosen: GameSystem | undefined = (systemsData ?? []).find(
        (s) => s.id === values.gameSystem,
      );
      return roleplayApi.create({
        name: values.name,
        description: values.description,
        setting: values.setting,
        gameSystem: values.gameSystem,
        systemFamily: chosen?.systemFamily ?? values.systemFamily ?? undefined,
        visibility: values.visibility,
      });
    },
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: ["roleplay"] });
      setCreateError(null);
      void navigate({ to: "/roleplay/$slug", params: { slug: campaign.slug } });
    },
    onError: () => setCreateError(texts.roleplay.createError),
  });

  if (isDetail) {
    return <Outlet />;
  }

  const directory = (list: Campaign[] | undefined): RoleplayCampaignData[] =>
    (list ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      gameSystem: c.gameSystem,
      systemFamily: c.systemFamily,
      visibility: c.visibility,
      status: c.status,
      members: c.members,
      viewerRole: c.viewerRole,
      joined: c.joined,
    }));

  const systems = (systemsData ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    systemFamily: s.systemFamily,
  }));

  const directoryProps: RoleplayDirectoryProps = {
    campaigns: directory(listData?.items),
    loading: isListLoading,
    loadError: isListError,
    onRetry: () => void refetch(),
    mine: authenticated && !isMineLoading ? directory(mineData?.items) : undefined,
    searchValue: query,
    onSearch: setQuery,
    onOpen: (campaign) => void navigate({ to: "/roleplay/$slug", params: { slug: campaign.slug } }),
    systems,
    onCreateSubmit: authenticated ? (values) => create.mutate(values) : undefined,
    creating: create.isPending,
    createError,
  };

  return (
    <AppContainer>
      <RoleplayDirectory {...directoryProps} />
    </AppContainer>
  );
}
