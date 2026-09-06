import type { SearchResponse } from "@/types/application/search/search-response";
import type { SearchResult } from "@/types/application/search/search-result";

import { api, buildQuery } from "../api-client";

export type { SearchResponse } from "@/types/application/search/search-response";
export type { SearchResult } from "@/types/application/search/search-result";

export const searchApi = {
  search: (query: string, types?: string[], limit = 10) =>
    api.get<SearchResponse>(
      `/search${buildQuery({
        q: query,
        types: types?.join(","),
        limit,
      })}`,
    ),
};
