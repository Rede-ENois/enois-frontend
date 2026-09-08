import type { MouseEvent } from "react";

import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";

import { resolveCdnUrl } from "@/lib/api/media";

export function createCommunityCardViewModel(
  community: Community,
  membershipPending: boolean,
  onToggleMembership: (communityId: string, joined: boolean) => void,
) {
  return {
    coverUrl: community.cover ? resolveCdnUrl(community.cover) : null,
    avatarUrl: community.avatar ? resolveCdnUrl(community.avatar) : null,
    membersLabel: texts.communities.members(community.members ?? 0),
    membershipAction: {
      variant: community.joined ? ("secondary" as const) : ("default" as const),
      label: community.joined ? texts.communities.participating : texts.communities.enter,
      disabled: membershipPending,
      run: (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onToggleMembership(community.id, community.joined);
      },
    },
  };
}
