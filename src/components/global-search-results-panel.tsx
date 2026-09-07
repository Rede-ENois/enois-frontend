import type { GlobalSearchResultsPanelProps } from "@/types/components/global-search/global-search-results-panel-props";

import { GlobalSearchResults } from "@/components/global-search-results";

export function GlobalSearchResultsPanel({ visible, ...results }: GlobalSearchResultsPanelProps) {
  if (!visible) return null;

  return (
    <div className="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl border border-border-soft bg-surface-card shadow-card md:left-0 md:right-0">
      <GlobalSearchResults {...results} />
    </div>
  );
}
