import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { Comunidades } from "@/components/pages/communities-page";

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.communities.seoTitle }] }),
  component: Comunidades,
});
