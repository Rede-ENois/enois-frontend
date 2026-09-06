import { createFileRoute } from "@tanstack/react-router";

import { z } from "zod";

import { texts } from "@/texts";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: texts.auth.seo.resetTitle },
      { name: "description", content: texts.auth.seo.resetDescription },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const token = Route.useSearch().token ?? "";

  return (
    <AuthPageLayout>
      <ResetPasswordForm token={token} />
    </AuthPageLayout>
  );
}
