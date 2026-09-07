import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Vagas } from "@/components/pages/jobs-page";

export const Route = createFileRoute("/vagas")({
  beforeLoad: requireAuth,
  head: () => createStaticRouteHead(texts.jobs.seoTitle),
  component: Vagas,
});
