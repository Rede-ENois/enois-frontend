import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Privacidade } from "@/components/pages/privacy-page";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: texts.legal.privacy.seoTitle },
      { name: "description", content: texts.legal.privacy.seoDescription },
    ],
  }),
  component: Privacidade,
});
