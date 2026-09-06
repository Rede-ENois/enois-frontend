import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Landing } from "@/components/pages/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: texts.landing.seo.title },
      { name: "description", content: texts.landing.seo.description },
      { property: "og:title", content: texts.landing.seo.title },
      { property: "og:description", content: texts.landing.seo.ogDescription },
    ],
  }),
  component: Landing,
});
