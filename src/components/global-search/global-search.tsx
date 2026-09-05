import { GlobalSearchMobileButton } from "./global-search-mobile-button";
import { GlobalSearchPanel } from "./global-search-panel";
import { useGlobalSearch } from "./use-global-search";

export function GlobalSearch() {
  const search = useGlobalSearch();

  return (
    <>
      <GlobalSearchMobileButton onOpen={search.openMobileSearch} />
      <GlobalSearchPanel
        query={search.query}
        debouncedQuery={search.debouncedQuery}
        results={search.results}
        isFetching={search.isFetching}
        isOpen={search.isOpen}
        isMobileOpen={search.isMobileOpen}
        searchRef={search.searchRef}
        inputRef={search.inputRef}
        onQueryChange={search.handleQueryChange}
        onFocus={search.handleFocus}
        onCloseMobile={search.closeMobileSearch}
        onSelect={search.handleSelect}
      />
    </>
  );
}
