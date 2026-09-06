import { api, buildQuery } from "../api-client";

export interface SearchResult {
  id: string;
  type: "users" | "communities" | "jobs" | "events";
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
}

export interface SearchResponse {
  items: SearchResult[];
  nextCursor: string | null;
}

export const searchApi = {
  search: (query: string, types?: string[], limit = 10) =>
    api.get<SearchResponse>(
      `/search${buildQuery({
        q: query,
        types: types?.join(","),
        limit,
      })}`,
    ),
};
