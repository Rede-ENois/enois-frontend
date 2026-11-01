import { useEffect } from "react";

import { hydratePreferences, usePreferencesStore } from "@/stores/preferences.store";
import { AppSidebar as AppSidebarView } from "@rede-enois/design-system/patterns";

import { NavigationLinks } from "./navigation-links";

/** Feeds the design system sidebar with the stored collapsed preference. */
export function AppSidebar() {
  const sidebarCollapsed = usePreferencesStore((state) => state.sidebarCollapsed);
  const toggleSidebar = usePreferencesStore((state) => state.toggleSidebar);

  useEffect(() => {
    hydratePreferences();
  }, []);

  return (
    <AppSidebarView collapsed={sidebarCollapsed} onToggle={toggleSidebar}>
      <NavigationLinks collapsed={sidebarCollapsed} />
    </AppSidebarView>
  );
}
