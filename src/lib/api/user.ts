import { api, buildQuery } from "../api-client";

export interface UserSearchResult {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

export const userApi = {
  search: (query: string) =>
    api.get<UserSearchResult[]>(`/users/search${buildQuery({ q: query })}`),
};
