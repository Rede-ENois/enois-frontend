import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { createStaticRouteHead } from "@/utils/routes/create-static-route-head";

import { resetPasswordRouteSearchSchema } from "@/lib/validation/reset-password-route-search-schema";

import { ResetPassword } from "@/components/pages/reset-password-page";

export const Route = createFileRoute("/auth/reset")({
  validateSearch: resetPasswordRouteSearchSchema,
  head: () => createStaticRouteHead(texts.auth.seo.resetTitle, texts.auth.seo.resetDescription),
  component: ResetPassword,
});
