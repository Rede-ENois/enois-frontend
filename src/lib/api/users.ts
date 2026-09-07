import type { UserSearchResult } from "@/types/application/user/user-search-result";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const usersApi = {
  search: (query: string) => apiRequest<UserSearchResult[]>("GET", `/users/search${buildQuery({ q: query })}`),
};
