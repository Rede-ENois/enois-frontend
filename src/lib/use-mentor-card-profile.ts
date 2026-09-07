import { useQuery } from "@tanstack/react-query";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useMentorCardProfile(userId: string) {
  const currentUserId = getCurrentUserId();
  const { data: user } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfileById(userId),
  });

  return { user, isOwner: currentUserId === userId };
}
