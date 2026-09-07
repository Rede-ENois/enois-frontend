import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Termos } from "@/components/pages/terms-page";

export const Route = createFileRoute("/termos")({
  head: () => createStaticRouteHead(texts.legal.terms.seoTitle, texts.legal.terms.seoDescription),
  component: Termos,
});
