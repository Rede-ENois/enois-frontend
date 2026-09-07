import { useEffect } from "react";

import { hydratePreferences } from "@/stores/hydrate-preferences";
import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { NavigationLinks } from "./navigation-links";

export function AppSidebar() {
  const sidebarCollapsed = usePreferencesStore((state) => state.sidebarCollapsed);
  const toggleSidebar = usePreferencesStore((state) => state.toggleSidebar);

  useEffect(() => {
    hydratePreferences();
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-20 hidden h-fit shrink-0 lg:block",
        sidebarCollapsed ? "w-16" : "w-60",
      )}
      style={{ transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className="flex flex-col gap-1">
        <button
          onClick={toggleSidebar}
          className="mb-1 grid h-8 w-8 place-items-center self-end rounded-lg text-text-subtle transition hover:bg-surface-2 hover:text-primary"
          aria-label={
            sidebarCollapsed ? texts.navigation.expandMenu : texts.navigation.collapseMenu
          }
          title={sidebarCollapsed ? texts.navigation.expandMenu : texts.navigation.collapseMenu}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>

        <NavigationLinks collapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}
