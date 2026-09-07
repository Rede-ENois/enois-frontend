import { useEffect } from "react";

import { hydratePreferences } from "@/stores/hydrate-preferences";
import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

export function useAppSidebarController() {
  const collapsed = usePreferencesStore((state) => state.sidebarCollapsed);
  const toggle = usePreferencesStore((state) => state.toggleSidebar);

  useEffect(() => {
    hydratePreferences();
  }, []);

  return {
    collapsed,
    toggle,
    widthClassName: collapsed ? "w-16" : "w-60",
    ToggleIcon: collapsed ? ChevronsRight : ChevronsLeft,
    toggleLabel: collapsed ? texts.navigation.expandMenu : texts.navigation.collapseMenu,
  };
}
