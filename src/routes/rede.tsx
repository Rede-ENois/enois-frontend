import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { Rede } from "@/components/pages/network-page";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: Rede,
});
