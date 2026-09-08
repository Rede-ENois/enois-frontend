import { useContext } from "react";

import { GlobalSearchContext } from "@/utils/components/search/global-search-context";

export function useGlobalSearchContext() {
  const context = useContext(GlobalSearchContext);

  if (!context) {
    throw new Error("Global search components must be rendered inside GlobalSearchProvider");
  }

  return context;
}
