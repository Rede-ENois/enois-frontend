import type { PageResponse } from "@/types/application/api/page-response";
import type { SearchResult } from "@/types/application/search/search-result";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function searchContent(q: string, types?: SearchResult["type"][], limit = 10) {
  return apiRequest<PageResponse<SearchResult>>(
    "GET",
    `/search${buildQuery({ q, types: types?.join(","), limit })}`,
  );
}
