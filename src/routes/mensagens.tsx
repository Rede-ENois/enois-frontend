import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Mensagens } from "@/components/pages/messages-page";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: texts.messages.seoTitle }] }),
  component: Mensagens,
});
