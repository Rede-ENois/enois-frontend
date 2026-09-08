import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { requireAuth } from "@/lib/require-auth";

import { CommunitiesPageProvider } from "@/components/communities-page-provider";

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.communities.seoTitle),
  component: CommunitiesPageProvider,
});
