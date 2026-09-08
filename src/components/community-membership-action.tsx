import { useCommunityMembership } from "@/utils/components/communities/use-community-membership";

import { Button } from "@/components/ui/button";

export function CommunityMembershipAction() {
  const membership = useCommunityMembership();

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
