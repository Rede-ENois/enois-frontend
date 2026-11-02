import type { CommunityLocationSearch } from "@/types/routes/communities/community-location-search";
import { BRAZIL_STATES, CITY_MAX_LENGTH } from "@rede-enois/design-system/patterns";

const UFS = new Set(BRAZIL_STATES.map((state) => state.code));

/**
 * `/comunidades?uf=MG&cidade=Belo%20Horizonte`: the location filter lives in the URL so it can be
 * shared. Same rules as the API: a known UF alone filters the state, a city only counts with one.
 */
export function parseCommunityLocationSearch(
  search: Record<string, unknown>,
): CommunityLocationSearch {
  const uf = typeof search.uf === "string" ? search.uf.trim().toUpperCase() : "";
  if (!UFS.has(uf)) return {};
  const cidade =
    typeof search.cidade === "string" ? search.cidade.trim().slice(0, CITY_MAX_LENGTH) : "";
  return cidade ? { uf, cidade } : { uf };
}
