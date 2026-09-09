import type { CommunityMember } from "@/types/application/community/community-member";

export type CommunityMemberItemProps = {
  member: CommunityMember;
  showAdminBadge: boolean;
};
