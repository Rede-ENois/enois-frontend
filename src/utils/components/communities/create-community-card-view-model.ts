import type { MouseEvent } from "react";

import { texts } from "@/texts";
import type { CommunityCardProps } from "@/types/components/communities/community-card-props";

import { resolveCdnUrl } from "@/lib/api/media";

export function createCommunityCardViewModel({
  community,
  membershipPending,
  onToggleMembership,
}: CommunityCardProps) {
  return {
    coverUrl: community.cover ? resolveCdnUrl(community.cover) : null,
    avatarUrl: community.avatar ? resolveCdnUrl(community.avatar) : null,
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
