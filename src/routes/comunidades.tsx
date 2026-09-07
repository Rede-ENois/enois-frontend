import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Comunidades } from "@/components/pages/communities-page";

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.communities.seoTitle),
  component: Comunidades,
});
