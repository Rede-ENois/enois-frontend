import { texts } from "@/texts";
import { createCommunityHeaderMedia } from "@/utils/components/communities/create-community-header-media";
import { useCommunityDetailContext } from "@/utils/components/communities/use-community-detail-context";
import { useCommunityHeaderAccess } from "@/utils/components/communities/use-community-header-access";

export function useCommunityHeaderController() {
  const { community, members } = useCommunityDetailContext();
  const access = useCommunityHeaderAccess(members);
  const media = createCommunityHeaderMedia(community);

  return {
    community,
    isAdmin: access.isAdmin,
    primaryAdmin: access.primaryAdmin,
    coverUrl: media.coverUrl,
    avatarUrl: media.avatarUrl,
    membersLabel: texts.communities.memberCount(community.members),
  };
}
