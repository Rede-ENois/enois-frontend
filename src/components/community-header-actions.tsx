import type { CommunityHeaderActionsProps } from "@/types/components/communities/community-header-actions-props";
import { useCommunityHeaderAccess } from "@/utils/components/communities/use-community-header-access";

import { CommunityHeaderEditAction } from "@/components/community-header-edit-action";
import { CommunityMembershipAction } from "@/components/community-membership-action";

export function CommunityHeaderActions({ community, members }: CommunityHeaderActionsProps) {
  const { isAdmin } = useCommunityHeaderAccess(members);

  return (
    <div className="flex items-center gap-2">
      {isAdmin && <CommunityHeaderEditAction community={community} />}
      <CommunityMembershipAction community={community} />
    </div>
  );
}
