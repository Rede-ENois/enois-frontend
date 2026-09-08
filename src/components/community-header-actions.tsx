import { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";

import { CommunityHeaderEditAction } from "@/components/community-header-edit-action";
import { CommunityMembershipAction } from "@/components/community-membership-action";

export function CommunityHeaderActions() {
  const { isAdmin } = useCommunityHeaderController();

  return (
    <div className="flex items-center gap-2">
      {isAdmin && <CommunityHeaderEditAction />}
      <CommunityMembershipAction />
    </div>
  );
}
