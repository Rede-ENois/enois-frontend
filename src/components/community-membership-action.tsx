import type { CommunityMembershipActionProps } from "@/types/components/communities/community-membership-action-props";

import { Button } from "@/components/ui/button";

export function CommunityMembershipAction({
  membershipPending,
  membershipVariant,
  membershipLabel,
  toggleMembership,
}: CommunityMembershipActionProps) {
  return (
    <Button
      className="shrink-0 rounded-full"
      variant={membershipVariant}
      disabled={membershipPending}
      onClick={toggleMembership}
    >
      {membershipLabel}
    </Button>
  );
}
