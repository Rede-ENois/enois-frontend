import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { texts } from "@/texts";
import { ResetPasswordPage } from "@/components/auth/reset/reset-password-page";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/reset")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: texts.auth.seo.resetTitle },
      { name: "description", content: texts.auth.seo.resetDescription },
    ],
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token = "" } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
