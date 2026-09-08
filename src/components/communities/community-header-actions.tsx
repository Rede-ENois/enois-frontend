import { useCommunityHeaderContext } from "@/utils/communities/use-community-header-context";

import { CommunityHeaderEditAction } from "@/components/communities/community-header-edit-action";
import { CommunityMembershipAction } from "@/components/communities/community-membership-action";

export function CommunityHeaderActions() {
  const { isAdmin } = useCommunityHeaderContext();

  return (
    <div className="flex items-center gap-2">
      {isAdmin && <CommunityHeaderEditAction />}
      <CommunityMembershipAction />
    </div>
  );
}
