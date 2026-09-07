import { useRouterState } from "@tanstack/react-router";

import { navigationItems } from "@/constants/navigation-items";
import type { NavigationLinksProps } from "@/types/components/navigation/navigation-links-props";

export function useNavigationLinksController({ collapsed }: NavigationLinksProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return {
    items: navigationItems.map((item) => ({
      ...item,
      active: pathname === item.to || pathname.startsWith(`${item.to}/`),
      title: collapsed ? item.label : undefined,
    })),
  };
}
