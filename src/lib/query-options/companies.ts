import { queryOptions } from "@tanstack/react-query";

import { companiesApi } from "@/lib/api";

export const companyQueries = {
  directoryKey: ["companies"] as const,
  mine: () =>
    queryOptions({ queryKey: ["my-companies"] as const, queryFn: () => companiesApi.mine() }),
  directory: (search: string, sector: string | null) =>
    queryOptions({
      queryKey: [...companyQueries.directoryKey, search, sector] as const,
      queryFn: () => companiesApi.directory(search, sector),
    }),
  sectors: () =>
    queryOptions({
      queryKey: [...companyQueries.directoryKey, "sectors"] as const,
      queryFn: () => companiesApi.sectors(),
      staleTime: 5 * 60_000,
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: ["empresa", slug] as const,
      queryFn: () => companiesApi.bySlug(slug),
    }),
};
