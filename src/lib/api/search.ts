import type { PageResponse } from "@/types/application/api/page-response";
import type { SearchResult } from "@/types/application/search/search-result";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const searchApi = {
  search: (q: string, types?: SearchResult["type"][], limit = 10) => apiRequest<PageResponse<SearchResult>>("GET", `/search${buildQuery({ q, types: types?.join(","), limit })}`),
};
