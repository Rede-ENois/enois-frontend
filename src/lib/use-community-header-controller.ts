import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";

import { joinCommunity } from "@/lib/api/communities/join-community";
import { leaveCommunity } from "@/lib/api/communities/leave-community";
import { useAuth } from "@/lib/use-auth";

export function useCommunityHeaderController(community: Community, members: CommunityMember[]) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const admins = members.filter((member) => member.role === "ADMIN");
  const isAdmin = currentUser ? admins.some((admin) => admin.userId === currentUser.id) : false;

  const membership = useMutation({
    mutationFn: () =>
      community.joined ? leaveCommunity(community.id) : joinCommunity(community.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community", community.id] }),
  });

  return {
    editOpen,
    setEditOpen,
    isAdmin,
    primaryAdmin: admins[0] ?? null,
    membershipPending: membership.isPending,
    toggleMembership: () => membership.mutate(),
  };
}
