import type { Community } from "@/types/application/community/community";

export type CommunitiesGridProps = {
  communities: Community[];
  isPending: boolean;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
};
