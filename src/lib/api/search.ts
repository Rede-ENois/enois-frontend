import type { PageResponse } from "@/types/application/api/page-response";
import type { SearchResult } from "@/types/application/search/search-result";

import { api, buildQuery } from "../api-client";

export const searchApi = {
  /**
   * `signal` vem do TanStack Query: ao trocar o termo, a busca anterior é cancelada em vez de
   * continuar na rede e resolver depois por cima do resultado mais novo.
   */
  search: (q: string, types?: SearchResult["type"][], limit = 10, signal?: AbortSignal) =>
    api.get<PageResponse<SearchResult>>(
      `/search${buildQuery({
        q,
        types: types?.join(","),
        limit,
      })}`,
      { signal },
    ),
};
