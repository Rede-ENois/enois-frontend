import type { CommunityMember } from "@/types/application/community/community-member";
import type { Community } from "@/types/application/community/community";

export type CommunityHeaderProps = {
  community: Community;
  members: CommunityMember[];
};
