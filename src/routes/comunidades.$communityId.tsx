import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { createCommunityRouteHead } from "@/utils/routes/create-community-route-head";
import { loadCommunityRoute } from "@/utils/routes/load-community-route";

import { CommunityDetail } from "@/components/pages/community-detail-page";

export const Route = createFileRoute("/comunidades/$communityId")({
  beforeLoad: requireAuth,
  loader: ({ params }) => loadCommunityRoute(params.communityId),
  head: ({ loaderData }) => createCommunityRouteHead(loaderData),
  component: CommunityDetail,
});
