import type { Community } from "@/types/application/community/community";

import { resolveCdnUrl } from "@/lib/api/media";

export function createCommunityHeaderMedia(community: Community) {
  return {
    coverUrl: community.cover ? resolveCdnUrl(community.cover) : null,
    avatarUrl: community.avatar ? resolveCdnUrl(community.avatar) : null,
  };
}
