import { texts } from "@/texts";
import type { CommunityMember } from "@/types/application/community/community-member";

export function createCommunityMembersViewModel(members: CommunityMember[]) {
  return {
    title: texts.communities.detail.membersTitle(members.length),
    members: members.map((member) => ({
      member,
      showAdminBadge: member.role === "ADMIN",
    })),
  };
}
