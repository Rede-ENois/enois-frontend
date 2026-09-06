import { Loader2, Search } from "lucide-react";

import { texts } from "@/texts";
import type { GlobalSearchPanelProps } from "@/types/components/global-search/global-search-panel-props";

import { Input } from "@/components/ui/input";
import { GlobalSearchResults } from "./global-search-results";

export function GlobalSearchPanel({
  query,
  debouncedQuery,
  results,
  isSearching,
  isOpen,
  isMobileOpen,
  searchRef,
  inputRef,
  onQueryChange,
  onFocus,
  onCloseMobile,
  onSelect,
}: GlobalSearchPanelProps) {
  return (
    <div
      ref={searchRef}
      className={`fixed inset-0 z-50 flex items-start justify-center bg-background/80 pt-4 backdrop-blur-sm transition-opacity ${
        isMobileOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
      } md:visible md:static md:z-auto md:ml-2 md:block md:flex-1 md:max-w-md md:bg-transparent md:p-0 md:opacity-100 md:backdrop-blur-none md:pointer-events-auto`}
      onMouseDown={(event) => {
        if (isMobileOpen && event.target === event.currentTarget) onCloseMobile();
      }}
    >
      <div className="relative w-full max-w-md px-4 md:max-w-none md:px-0">
        <Search className="pointer-events-none absolute left-7 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-subtle md:left-3" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          placeholder={texts.search.placeholder}
          className="h-12 rounded-full border-border-soft bg-surface-card pl-10 pr-4 focus-visible:border-primary md:h-10 md:bg-surface-1 md:pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-subtle md:right-3" />
        )}
        {isOpen && debouncedQuery.length >= 2 && (
          <div className="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl border border-border-soft bg-surface-card shadow-card md:left-0 md:right-0">
            <GlobalSearchResults
              items={results}
              query={debouncedQuery}
              isSearching={isSearching}
              onSelect={onSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
