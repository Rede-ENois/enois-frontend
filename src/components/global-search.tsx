import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { navigateToHref } from "@/utils/navigation";
import { GlobalSearch as GlobalSearchView } from "@rede-enois/design-system/domain";

import { searchApi } from "@/lib/api";

/** Runs the global search for the design system field and navigates to the chosen result. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [debounced, setDebounced] = useState("");

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchApi.search(debounced),
    enabled: debounced.length >= 2,
  });

  return (
    <GlobalSearchView
      results={results?.items ?? []}
      isFetching={isFetching}
      onQueryChange={setDebounced}
      onSelect={(item) => navigateToHref(item.href, navigate)}
    />
  );
}
