import type { PageResponse } from "@/types/application/pagination/page-response";
import type { SearchResult } from "@/types/application/search/search-result";

import { api, buildQuery } from "../api-client";

export type { SearchResult } from "@/types/application/search/search-result";

export const searchApi = {
  search: (query: string, types?: string[], limit = 10) =>
    api.get<PageResponse<SearchResult>>(
      `/search${buildQuery({
        q: query,
        types: types?.join(","),
        limit,
      })}`,
    ),
};
