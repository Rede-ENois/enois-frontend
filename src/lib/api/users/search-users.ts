import type { UserSearchResult } from "@/types/application/user/user-search-result";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function searchUsers(query: string) {
  return apiRequest<UserSearchResult[]>("GET", `/users/search${buildQuery({ q: query })}`);
}
