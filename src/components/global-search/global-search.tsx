import { GlobalSearchMobileButton } from "./global-search-mobile-button";
import { GlobalSearchPanel } from "./global-search-panel";
import { useGlobalSearch } from "./use-global-search";

export function GlobalSearch() {
  const searchState = useGlobalSearch();

  return (
    <>
      <GlobalSearchMobileButton onOpen={searchState.openMobileSearch} />
      <GlobalSearchPanel
        query={searchState.query}
        debouncedQuery={searchState.debouncedQuery}
        results={searchState.results}
        isSearching={searchState.isSearching}
        isOpen={searchState.isOpen}
        isMobileOpen={searchState.isMobileOpen}
        searchRef={searchState.searchRef}
        inputRef={searchState.inputRef}
        onQueryChange={searchState.handleQueryChange}
        onFocus={searchState.handleFocus}
        onCloseMobile={searchState.closeMobileSearch}
        onSelect={searchState.handleSelect}
      />
    </>
  );
}
