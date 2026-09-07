import { useQuery } from "@tanstack/react-query";

import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";
import { getProfileById } from "@/lib/api/profile/get-profile-by-id";

export function useMentorCardProfile(userId: string) {
  const { data: user } = useQuery({
    queryKey: ["profile", "by-id", userId],
    queryFn: () => getProfileById(userId),
  });
  const { data: currentProfile } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentProfile,
  });

  return {
    user,
    isOwner: currentProfile?.id === userId,
  };
}
