import { createFileRoute, notFound } from "@tanstack/react-router";

import { getCommunity } from "@/lib/api/communities/get-community";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { CommunityDetail } from "@/components/pages/community-detail-page";

export const Route = createFileRoute("/comunidades/$communityId")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    try {
      return await getCommunity(params.communityId);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.name ?? texts.communities.detail.seoFallback} · ${texts.brand.name}`,
      },
    ],
  }),
  component: CommunityDetail,
});
