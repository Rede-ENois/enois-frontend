import type { CommunityMembershipActionProps } from "@/types/components/communities/community-membership-action-props";
import { useCommunityMembership } from "@/utils/components/communities/use-community-membership";

import { Button } from "@/components/ui/button";

export function CommunityMembershipAction({ community }: CommunityMembershipActionProps) {
  const membership = useCommunityMembership(community);

  return (
    <Button
      className="shrink-0 rounded-full"
      variant={membership.variant}
      disabled={membership.pending}
      onClick={membership.toggle}
    >
      {membership.label}
    </Button>
  );
}
