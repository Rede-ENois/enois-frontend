import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { requireAuth } from "@/lib/require-auth";

import { Eventos } from "@/components/pages/events-page";

export const Route = createFileRoute("/eventos")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.events.seoTitle),
  component: Eventos,
});
