import { texts } from "@/texts";
import { useGlobalSearchContext } from "@/utils/components/search/use-global-search-context";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function GlobalSearchField() {
  const { inputRef, query, isFetching, handleQueryChange, handleFocus } = useGlobalSearchContext();

  return (
    <>
      <Search className="pointer-events-none absolute left-7 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-subtle md:left-3" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={handleFocus}
        placeholder={texts.search.placeholder}
        className="h-12 rounded-full border-border-soft bg-surface-card pl-10 pr-4 focus-visible:border-primary md:h-10 md:bg-surface-1 md:pl-9"
      />
      {isFetching && (
        <Loader2 className="absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-subtle md:right-3" />
      )}
    </>
  );
}
