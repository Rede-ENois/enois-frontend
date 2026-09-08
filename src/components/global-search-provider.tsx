import { GlobalSearchContext } from "@/utils/components/search/global-search-context";
import { useGlobalSearch } from "@/utils/components/search/use-global-search";

import { GlobalSearch } from "@/components/global-search";

export function GlobalSearchProvider() {
  const search = useGlobalSearch();

  return (
    <GlobalSearchContext.Provider value={search}>
      <GlobalSearch />
    </GlobalSearchContext.Provider>
  );
}
