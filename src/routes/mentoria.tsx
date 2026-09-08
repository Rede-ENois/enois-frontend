import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { requireAuth } from "@/lib/require-auth";

import { Mentoria } from "@/components/pages/mentoring-page";

export const Route = createFileRoute("/mentoria")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.mentoring.seoTitle),
  component: Mentoria,
});
