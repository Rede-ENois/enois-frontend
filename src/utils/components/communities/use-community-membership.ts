import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";

import { joinCommunity } from "@/lib/api/communities/join-community";
import { leaveCommunity } from "@/lib/api/communities/leave-community";

export function useCommunityMembership(community: Community) {
  const queryClient = useQueryClient();
  const membership = useMutation({
    mutationFn: () =>
      community.joined ? leaveCommunity(community.id) : joinCommunity(community.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", community.id] }),
  });

  return {
    pending: membership.isPending,
    variant: community.joined ? ("secondary" as const) : ("default" as const),
    label: community.joined ? texts.communities.participating : texts.communities.enter,
    toggle: () => membership.mutate(),
  };
}
