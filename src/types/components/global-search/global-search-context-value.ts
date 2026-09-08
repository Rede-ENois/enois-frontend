import type { FocusEventHandler, MouseEventHandler, RefObject } from "react";

import type { SearchResult } from "@/types/application/search/search-result";

export type GlobalSearchContextValue = {
  query: string;
  debounced: string;
  mobileOpen: boolean;
  searchRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  items: SearchResult[];
  isFetching: boolean;
  showResults: boolean;
  openMobileSearch: () => void;
  handleBackdropMouseDown: MouseEventHandler<HTMLDivElement>;
  handleQueryChange: (value: string) => void;
  handleFocus: FocusEventHandler<HTMLInputElement>;
  handleSelect: (item: SearchResult) => void;
};
