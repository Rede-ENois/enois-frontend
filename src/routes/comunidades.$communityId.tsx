import { createFileRoute } from "@tanstack/react-router";

import { createCommunityRouteHead } from "@/utils/routes/create-community-route-head";
import { loadCommunityRoute } from "@/utils/routes/load-community-route";

import { requireAuth } from "@/lib/require-auth";

import { CommunityDetailProvider } from "@/components/community-detail-provider";

export const Route = createFileRoute("/comunidades/$communityId")({
  beforeLoad: requireAuth,
  loader: ({ params }) => loadCommunityRoute(params.communityId),
  head: ({ loaderData }) => createCommunityRouteHead(loaderData),
  component: CommunityDetailProvider,
});
