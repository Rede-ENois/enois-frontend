import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Mensagens } from "@/components/messages/messages-page";

export const Route = createFileRoute("/mensagens")({
  head: () => createStaticRouteHead(texts.messages.seoTitle),
  component: Mensagens,
});
