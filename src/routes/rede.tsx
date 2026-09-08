import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { requireAuth } from "@/lib/require-auth";

import { Rede } from "@/components/pages/network-page";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.network.seoTitle),
  component: Rede,
});
