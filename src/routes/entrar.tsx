import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { authRouteSearchSchema } from "@/lib/validation/auth-route-search-schema";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { Auth } from "@/components/pages/auth-page";

export const Route = createFileRoute("/entrar")({
  validateSearch: authRouteSearchSchema,
  head: () => createStaticRouteHead(texts.auth.seo.authTitle, texts.auth.seo.authDescription),
  component: Auth,
});
