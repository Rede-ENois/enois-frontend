import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Termos } from "@/components/pages/terms-page";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: texts.legal.terms.seoTitle },
      { name: "description", content: texts.legal.terms.seoDescription },
    ],
  }),
  component: Termos,
});
