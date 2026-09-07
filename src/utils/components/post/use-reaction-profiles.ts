import { useQuery } from "@tanstack/react-query";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";

export function useReactionProfiles(userIds: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["profiles", "by-ids", [...userIds].sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(userIds.map((id) => getProfileById(id).catch(() => null)));
      return Object.fromEntries(results.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: enabled && userIds.length > 0,
  }).data;
}
