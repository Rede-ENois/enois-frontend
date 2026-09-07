import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";

export type CommunityHeaderProps = {
  community: Community;
  members: CommunityMember[];
};
