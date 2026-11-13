import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { navigateToHref } from "@/utils/navigation";
import { GlobalSearch as GlobalSearchView } from "@rede-enois/design-system/domain";

import { searchApi } from "@/lib/api";
import { matchFeatures } from "@/lib/feature-search";
import { useInterfaceContext } from "@/lib/interface-context";
import { useDisabledModules } from "@/lib/use-personalization";

/**
 * Runs the global search for the design system field (app features plus people, posts and the
 * rest from the API) and navigates to the chosen result.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [debounced, setDebounced] = useState("");
  const context = useInterfaceContext();
  const disabledModules = useDisabledModules();
  // The app's own places first: people looked for "carteira" or "vagas" and found nobody.
  const features = matchFeatures(debounced, context, disabledModules);

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: ({ signal }) => searchApi.search(debounced, undefined, 10, signal),
    enabled: debounced.length >= 2,
  });

  return (
    <GlobalSearchView
      results={[...features, ...(results?.items ?? [])]}
      isFetching={isFetching}
      onQueryChange={setDebounced}
      onSelect={(item) => navigateToHref(item.href, navigate)}
    />
  );
}
