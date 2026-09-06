import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { SavedPosts } from "@/components/pages/saved-posts-page";

export const Route = createFileRoute("/salvos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.saved.seoTitle }] }),
  component: SavedPosts,
});
