import { useGlobalSearchContext } from "@/utils/components/search/use-global-search-context";

import { GlobalSearchField } from "@/components/global-search-field";
import { GlobalSearchResultsPanel } from "@/components/global-search-results-panel";

export function GlobalSearchOverlay() {
  const { searchRef, mobileOpen, handleBackdropMouseDown } = useGlobalSearchContext();

  return (
    <div
      ref={searchRef}
      className={`fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-4 backdrop-blur-sm transition-opacity ${
        mobileOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
      } md:visible md:static md:z-auto md:ml-2 md:block md:flex-1 md:max-w-md md:bg-transparent md:p-0 md:opacity-100 md:backdrop-blur-none md:pointer-events-auto`}
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="relative w-full max-w-md px-4 md:max-w-none md:px-0">
        <GlobalSearchField />
        <GlobalSearchResultsPanel />
      </div>
    </div>
  );
}
