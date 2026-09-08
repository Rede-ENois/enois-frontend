import { useRouterState } from "@tanstack/react-router";

import { navigationItems } from "@/constants/navigation-items";
import { useAppShellStore } from "@/stores/app-shell.store";
import { usePreferencesStore } from "@/stores/preferences.store";
import type { NavigationLinksProps } from "@/types/components/navigation/navigation-links-props";

export function useNavigationLinksController(variant: NavigationLinksProps["variant"]) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const sidebarCollapsed = usePreferencesStore((state) => state.sidebarCollapsed);
  const closeMobileNavigation = useAppShellStore((state) => state.closeMobileNavigation);
  const collapsed = variant === "sidebar" && sidebarCollapsed;

  return {
    collapsed,
    handleNavigate: variant === "drawer" ? closeMobileNavigation : undefined,
    items: navigationItems.map((item) => ({
      ...item,
      active: pathname === item.to || pathname.startsWith(`${item.to}/`),
      title: collapsed ? item.label : undefined,
    })),
  };
}
