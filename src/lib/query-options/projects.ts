import { queryOptions } from "@tanstack/react-query";

import { communityProjectsApi, projectsApi } from "@/lib/api";

export const projectQueries = {
  all: ["projects"] as const,
  profileMine: () =>
    queryOptions({
      queryKey: ["projects", "profile", "mine"] as const,
      queryFn: () => projectsApi.mine(),
    }),
  communityMine: () =>
    queryOptions({
      queryKey: ["projects", "community", "mine"] as const,
      queryFn: () => communityProjectsApi.mine(),
    }),
};
