import type { Community } from "@/types/application/community/community";
import type { CommunityCardMembershipAction } from "@/types/components/communities/community-card-membership-action";

export type CommunityCardContextValue = {
  community: Community;
  coverUrl?: string | null;
  avatarUrl?: string | null;
  membersLabel: string;
  membershipAction: CommunityCardMembershipAction;
};
