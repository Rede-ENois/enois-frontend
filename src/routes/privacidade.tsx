import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Privacidade } from "@/components/pages/privacy-page";

export const Route = createFileRoute("/privacidade")({
  head: () =>
    createStaticRouteHead(texts.legal.privacy.seoTitle, texts.legal.privacy.seoDescription),
  component: Privacidade,
});
