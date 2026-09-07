import type { Community } from "@/types/application/community/community";

export type CommunitiesGridProps = {
  communities: Community[];
  membershipPending: boolean;
  onToggleMembership: (communityId: string, joined: boolean) => void;
};
