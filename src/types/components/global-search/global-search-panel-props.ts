import type { RefObject } from "react";
import type { SearchResult } from "@/types/application/search/search-result";

export type GlobalSearchPanelProps = {
  query: string;
  debouncedQuery: string;
  results: SearchResult[];
  isSearching: boolean;
  isOpen: boolean;
  isMobileOpen: boolean;
  searchRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onCloseMobile: () => void;
  onSelect: (item: SearchResult) => void;
};
