import { queryOptions } from "@tanstack/react-query";

import { communitiesApi } from "@/lib/api";

export const communityQueries = {
  all: ["communities"] as const,
  mineKey: ["communities", "mine"] as const,
  mine: (limit: number) =>
    queryOptions({
      queryKey: [...communityQueries.mineKey, { limit }] as const,
      queryFn: () => communitiesApi.mine(limit),
    }),
};
