import type { CommunityMember } from "@/types/application/community/community-member";

import { useAuth } from "@/lib/use-auth";

export function useCommunityHeaderAccess(members: CommunityMember[]) {
  const { user: currentUser } = useAuth();
  const admins = members.filter((member) => member.role === "ADMIN");

  return {
    isAdmin: currentUser ? admins.some((admin) => admin.userId === currentUser.id) : false,
    primaryAdmin: admins[0] ?? null,
  };
}
