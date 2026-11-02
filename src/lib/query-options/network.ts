import { queryOptions } from "@tanstack/react-query";

import { networkApi } from "@/lib/api";

export const networkQueries = {
  all: ["network"] as const,
  requests: (limit: number) =>
    queryOptions({
      queryKey: ["network", "requests", { limit }] as const,
      queryFn: () => networkApi.requests(null, limit),
    }),
};
