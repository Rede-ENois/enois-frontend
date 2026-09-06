import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { Eventos } from "@/components/pages/events-page";

export const Route = createFileRoute("/eventos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.events.seoTitle }] }),
  component: Eventos,
});
