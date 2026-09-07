import type { CommunityHeaderProps } from "@/types/components/communities/community-header-props";

import { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";

import { CommunityHeaderActions } from "@/components/community-header-actions";
import { CommunityHeaderIdentity } from "@/components/community-header-identity";
import { CommunityHeaderMedia } from "@/components/community-header-media";

export function CommunityHeader({ community, members }: CommunityHeaderProps) {
  const controller = useCommunityHeaderController(community, members);

  return (
    <div className="surface-card overflow-hidden">
      <CommunityHeaderMedia coverUrl={controller.coverUrl} />

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CommunityHeaderIdentity
            community={community}
            primaryAdmin={controller.primaryAdmin}
            avatarUrl={controller.avatarUrl}
          />

          <CommunityHeaderActions
            community={community}
            isAdmin={controller.isAdmin}
            editOpen={controller.editOpen}
            setEditOpen={controller.setEditOpen}
            closeEdit={controller.closeEdit}
            membershipPending={controller.membershipPending}
            membershipVariant={controller.membershipVariant}
            membershipLabel={controller.membershipLabel}
            toggleMembership={controller.toggleMembership}
          />
        </div>
      </div>
    </div>
  );
}
