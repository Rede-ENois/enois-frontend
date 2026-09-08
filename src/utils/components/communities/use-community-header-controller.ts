import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";

import { createCommunityHeaderMedia } from "@/utils/components/communities/create-community-header-media";
import { useCommunityHeaderAccess } from "@/utils/components/communities/use-community-header-access";

export function useCommunityHeaderController(community: Community, members: CommunityMember[]) {
  const access = useCommunityHeaderAccess(members);
  const media = createCommunityHeaderMedia(community);

  return {
    primaryAdmin: access.primaryAdmin,
    coverUrl: media.coverUrl,
    avatarUrl: media.avatarUrl,
  };
}
