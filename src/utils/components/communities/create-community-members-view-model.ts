import { texts } from "@/texts";
import type { CommunityMembersProps } from "@/types/components/communities/community-members-props";

export function createCommunityMembersViewModel({ members }: CommunityMembersProps) {
  return {
    title: texts.communities.detail.membersTitle(members.length),
    members: members.map((member) => ({
      member,
      showAdminBadge: member.role === "ADMIN",
    })),
  };
}
