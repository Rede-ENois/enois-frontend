import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Home } from "@/components/pages/feed-page";

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.feed.seo.title, texts.feed.seo.description),
  component: Home,
});
