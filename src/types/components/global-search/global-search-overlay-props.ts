import type { FocusEventHandler, MouseEventHandler, RefObject } from "react";

import type { SearchResult } from "@/types/application/search/search-result";

export type GlobalSearchOverlayProps = {
  query: string;
  debounced: string;
  mobileOpen: boolean;
  searchRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  items: SearchResult[];
  isFetching: boolean;
  showResults: boolean;
  onBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
  onQueryChange: (value: string) => void;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onSelect: (item: SearchResult) => void;
};
