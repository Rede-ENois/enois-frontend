import type { UserSearchResult } from "@/types/application/user/user-search-result";

import { api, buildQuery } from "../api-client";

export type { UserSearchResult } from "@/types/application/user/user-search-result";

export const userApi = {
  search: (query: string) =>
    api.get<UserSearchResult[]>(`/users/search${buildQuery({ q: query })}`),
};
