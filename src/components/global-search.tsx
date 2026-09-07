import { useGlobalSearch } from "@/utils/components/search/use-global-search";

import { GlobalSearchMobileTrigger } from "@/components/global-search-mobile-trigger";
import { GlobalSearchOverlay } from "@/components/global-search-overlay";

export function GlobalSearch() {
  const search = useGlobalSearch();

  return (
    <>
      <GlobalSearchMobileTrigger onOpen={search.openMobileSearch} />
      <GlobalSearchOverlay
        query={search.query}
        debounced={search.debounced}
        mobileOpen={search.mobileOpen}
        searchRef={search.searchRef}
        inputRef={search.inputRef}
        items={search.items}
        isFetching={search.isFetching}
        showResults={search.showResults}
        onBackdropMouseDown={search.handleBackdropMouseDown}
        onQueryChange={search.handleQueryChange}
        onFocus={search.handleFocus}
        onSelect={search.handleSelect}
      />
    </>
  );
}
