import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";

export type CommunityHeaderIdentityProps = {
  community: Community;
  primaryAdmin: CommunityMember | null;
  avatarUrl?: string | null;
};
