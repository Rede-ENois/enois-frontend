import type { Community } from "@/types/application/community/community";
import type { CommunityCardMembershipAction } from "@/types/components/communities/community-card-membership-action";

export type CommunityCardContentProps = {
  community: Community;
  avatarUrl?: string | null;
  membershipAction: CommunityCardMembershipAction;
};
