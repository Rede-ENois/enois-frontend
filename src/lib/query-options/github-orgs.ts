import { queryOptions } from "@tanstack/react-query";

import { githubProfileApi } from "@/lib/api";

/** Organizações do vínculo do GitHub: mudam pouco e só com a conta; não vale refazer a cada abertura. */
export const githubOrgQueries = {
  list: () =>
    queryOptions({
      queryKey: ["github", "orgs"] as const,
      queryFn: () => githubProfileApi.orgs(),
      staleTime: 5 * 60_000,
    }),
  repos: (org: string) =>
    queryOptions({
      queryKey: ["github", "orgs", org, "repos"] as const,
      queryFn: () => githubProfileApi.orgRepos(org),
      staleTime: 5 * 60_000,
    }),
};
