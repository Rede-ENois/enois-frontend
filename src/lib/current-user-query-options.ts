import { queryOptions } from "@tanstack/react-query";

import { CURRENT_USER_QUERY_KEY } from "@/constants/current-user-query-key";

import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentProfile,
    staleTime: 60_000,
    retry: 1,
  });
}
