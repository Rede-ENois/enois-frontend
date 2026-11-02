import { queryOptions } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";

export const profileQueries = {
  byUsernameOrId: (username: string | null | undefined, userId: string | null | undefined) =>
    queryOptions({
      queryKey: username ? ["profile", username] : ["profile", "by-id", userId ?? ""],
      queryFn: () => (username ? profileApi.get(username) : profileApi.getById(userId ?? "")),
    }),
  byId: (userId: string) =>
    queryOptions({
      queryKey: ["profile", "by-id", userId] as const,
      queryFn: () => profileApi.getById(userId),
    }),
};
