import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { browserQueryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  if (typeof window !== "undefined") browserQueryClient.current = queryClient;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
