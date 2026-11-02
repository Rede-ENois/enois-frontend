import { queryOptions } from "@tanstack/react-query";

import { walletApi } from "@/lib/api";

export const walletQueries = {
  wallet: () =>
    queryOptions({
      queryKey: ["carteira"] as const,
      queryFn: () => walletApi.wallet(),
    }),
};
