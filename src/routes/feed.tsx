import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { Home } from "@/components/pages/feed-page";

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: texts.feed.seo.title },
      {
        name: "description",
        content: texts.feed.seo.description,
      },
    ],
  }),
  component: Home,
});
