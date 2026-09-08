import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { useCommunityDetailContext } from "@/utils/components/communities/use-community-detail-context";

import { joinCommunity } from "@/lib/api/communities/join-community";
import { leaveCommunity } from "@/lib/api/communities/leave-community";

export function useCommunityMembership() {
  const { community } = useCommunityDetailContext();
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
