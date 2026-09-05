import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { NetworkPage } from "@/components/network/page/network-page";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: NetworkPage,
});
