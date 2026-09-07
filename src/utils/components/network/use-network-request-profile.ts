import { useQuery } from "@tanstack/react-query";

import type { RequestCardProps } from "@/types/components/network/request-card-props";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useNetworkRequestProfile(request: RequestCardProps["request"]) {
  const currentUserId = getCurrentUserId();
  const isOutgoing = request.fromUserId === currentUserId;
  const targetUserId = isOutgoing ? request.toUserId : request.fromUserId;
  const { data: user } = useQuery({
    queryKey: ["profile", "by-id", targetUserId],
    queryFn: () => getProfileById(targetUserId),
  });

  return { user, isOutgoing, targetUserId };
}
