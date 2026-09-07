import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { SavedPosts } from "@/components/pages/saved-posts-page";

export const Route = createFileRoute("/salvos")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.saved.seoTitle),
  component: SavedPosts,
});
