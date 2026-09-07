import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";

export function createCommunityRouteHead(community?: Community) {
  return {
    meta: [
      {
        title: `${community?.name ?? texts.communities.detail.seoFallback} · ${texts.brand.name}`,
      },
    ],
  };
}
