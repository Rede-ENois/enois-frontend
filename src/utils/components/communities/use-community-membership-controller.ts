import { useMutation, useQueryClient } from "@tanstack/react-query";

import { joinCommunity } from "@/lib/api/communities/join-community";
import { leaveCommunity } from "@/lib/api/communities/leave-community";

export function useCommunityMembershipController() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["communities"] });
  const join = useMutation({ mutationFn: joinCommunity, onSuccess: invalidate });
  const leave = useMutation({ mutationFn: leaveCommunity, onSuccess: invalidate });

  return {
    pending: join.isPending || leave.isPending,
    toggle: (communityId: string, joined: boolean) => {
      if (joined) leave.mutate(communityId);
      else join.mutate(communityId);
    },
  };
}
