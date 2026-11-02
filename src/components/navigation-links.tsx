import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { COMMUNITY_FAVORITES_KEY } from "@/constants/community-favorites";
import type { NavigationLinksProps } from "@/types/components/navigation/navigation-links-props";
import { NavigationLinks as NavigationLinksView } from "@rede-enois/design-system/domain";

import { communitiesApi } from "@/lib/api";
import { useInterfaceContext } from "@/lib/interface-context";
import { communityQueries } from "@/lib/query-options/communities";
import { hasSessionFlag } from "@/lib/session";
import { useDisabledModules } from "@/lib/use-personalization";

import { navigationItemsFor } from "./navigation-items";

/**
 * Resolves the menu of the active interface (Social or Profissional), the active route and, in the
 * social one, the account's communities for the view.
 */
export function NavigationLinks({
  collapsed = false,
  onNavigate,
  className,
}: NavigationLinksProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const context = useInterfaceContext();
  const social = context === "SOCIAL";
  // Módulos desativados nas preferências: a entrada some do menu (fonte única no backend).
  const disabledModules = useDisabledModules();

  // Comunidades do usuário no menu: sem isso a pessoa só encontrava as suas indo em /comunidades
  // e procurando na lista.
  const { data: mine } = useQuery({
    ...communityQueries.mine(8),
    enabled: hasSessionFlag() && social,
    staleTime: 30_000,
  });
  const myCommunities = mine?.items ?? [];

  const { data: favorites } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
    enabled: hasSessionFlag() && social,
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
      items={navigationItemsFor(context)
        .filter((item) => !item.module || !disabledModules.has(item.module))
        .map((item) => ({
          href: item.to,
          label: item.label,
          icon: item.icon,
          active: pathname === item.to || pathname.startsWith(`${item.to}/`),
        }))}
      myCommunities={social ? myCommunities.map(toLink) : []}
      favoriteCommunities={social ? favoriteCommunities.map(toLink) : []}
      collapsed={collapsed}
      onNavigate={onNavigate}
      className={className}
    />
  );
}
