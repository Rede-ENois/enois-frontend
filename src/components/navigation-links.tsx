import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { COMMUNITY_FAVORITES_KEY } from "@/constants/community-favorites";
import type { NavigationLinksProps } from "@/types/components/navigation/navigation-links-props";
import { NavigationLinks as NavigationLinksView } from "@rede-enois/design-system/domain";

import { communitiesApi } from "@/lib/api";
import { hasSessionFlag } from "@/lib/session";
import { useDisabledModules } from "@/lib/use-personalization";

import { navigationItems } from "./navigation-items";

/** Resolves the menu entries, the active route and the account's communities for the view. */
export function NavigationLinks({
  collapsed = false,
  onNavigate,
  className,
}: NavigationLinksProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Módulos desativados nas preferências: a entrada some do menu (fonte única no backend).
  const disabledModules = useDisabledModules();

  // Comunidades do usuário no menu: sem isso a pessoa só encontrava as suas indo em /comunidades
  // e procurando na lista.
  const { data: mine } = useQuery({
    queryKey: ["my-communities"],
    queryFn: () => communitiesApi.mine(8),
    enabled: hasSessionFlag(),
    staleTime: 30_000,
  });
  const myCommunities = mine?.items ?? [];

  const { data: favorites } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
    enabled: hasSessionFlag(),
    staleTime: 30_000,
  });
  const favoriteCommunities = favorites?.items ?? [];

  const toLink = (community: { id: string; name: string }) => ({
    id: community.id,
    name: community.name,
    href: `/comunidades/${community.id}`,
  });

  return (
    <NavigationLinksView
      items={navigationItems
        .filter((item) => !item.module || !disabledModules.has(item.module))
        .map((item) => ({
          href: item.to,
          label: item.label,
          icon: item.icon,
          active: pathname === item.to || pathname.startsWith(`${item.to}/`),
        }))}
      myCommunities={myCommunities.map(toLink)}
      favoriteCommunities={favoriteCommunities.map(toLink)}
      collapsed={collapsed}
      onNavigate={onNavigate}
      className={className}
    />
  );
}
