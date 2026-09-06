import type { SearchResult } from "./search-result";

export type SearchResponse = {
  items: SearchResult[];
  nextCursor: string | null;
};
