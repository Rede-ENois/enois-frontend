import type { Community } from "@/types/application/community/community";

export type CommunityCardProps = {
  community: Community;
  membershipPending: boolean;
  onToggleMembership: (communityId: string, joined: boolean) => void;
};
