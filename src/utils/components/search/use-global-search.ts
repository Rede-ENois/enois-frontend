import { useNavigate } from "@tanstack/react-router";

import type { SearchResult } from "@/types/application/search/search-result";
import { useGlobalSearchInput } from "@/utils/components/search/use-global-search-input";
import { useGlobalSearchOverlay } from "@/utils/components/search/use-global-search-overlay";
import { useGlobalSearchResults } from "@/utils/components/search/use-global-search-results";
import { navigateToHref } from "@/utils/navigation";

export function useGlobalSearch() {
  const navigate = useNavigate();
  const input = useGlobalSearchInput();
  const overlay = useGlobalSearchOverlay(input.clearQuery);
  const results = useGlobalSearchResults(input.query);

  const handleQueryChange = (value: string) => {
    input.setQuery(value);
    overlay.openResults();
  };

  const handleSelect = (item: SearchResult) => {
    overlay.closeMobileSearch();
    navigateToHref(item.href, navigate);
  };

  return {
    query: input.query,
    debounced: results.debounced,
    mobileOpen: overlay.mobileOpen,
    searchRef: overlay.searchRef,
    inputRef: overlay.inputRef,
    items: results.items,
    isFetching: results.isFetching,
    showResults: overlay.open && results.debounced.length >= 2,
    openMobileSearch: overlay.openMobileSearch,
    handleBackdropMouseDown: overlay.handleBackdropMouseDown,
    handleQueryChange,
    handleFocus: overlay.openResults,
    handleSelect,
  };
}
