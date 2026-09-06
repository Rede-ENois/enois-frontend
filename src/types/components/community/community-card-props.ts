import type { Community } from "@/types/application/community/community";

export type CommunityCardProps = {
  community: Community;
  isPending: boolean;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
};
