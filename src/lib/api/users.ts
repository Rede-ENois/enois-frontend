import type { UserSearchResult } from "@/types/application/user/user-search-result";

import { api, buildQuery } from "../api-client";

export const usersApi = {
  /** `signal` vem do TanStack Query: trocar o termo cancela a busca anterior de verdade. */
  search: (query: string, signal?: AbortSignal) =>
    api.get<UserSearchResult[]>(`/users/search${buildQuery({ q: query })}`, { signal }),
};
