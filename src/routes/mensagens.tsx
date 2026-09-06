import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { MessagesPage } from "@/components/message/page/messages-page";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: texts.messages.seoTitle }] }),
  component: MessagesPage,
});
