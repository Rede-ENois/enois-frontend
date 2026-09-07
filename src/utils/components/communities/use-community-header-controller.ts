import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";

import { createCommunityHeaderMedia } from "@/utils/components/communities/create-community-header-media";
import { useCommunityHeaderAccess } from "@/utils/components/communities/use-community-header-access";
import { useCommunityHeaderEditState } from "@/utils/components/communities/use-community-header-edit-state";
import { useCommunityMembership } from "@/utils/components/communities/use-community-membership";

export function useCommunityHeaderController(community: Community, members: CommunityMember[]) {
  const access = useCommunityHeaderAccess(members);
  const edit = useCommunityHeaderEditState();
  const membership = useCommunityMembership(community);
  const media = createCommunityHeaderMedia(community);

  return {
    editOpen: edit.open,
    setEditOpen: edit.setOpen,
    closeEdit: edit.close,
    isAdmin: access.isAdmin,
    primaryAdmin: access.primaryAdmin,
    coverUrl: media.coverUrl,
    avatarUrl: media.avatarUrl,
    membershipPending: membership.pending,
    membershipVariant: membership.variant,
    membershipLabel: membership.label,
    toggleMembership: membership.toggle,
  };
}
