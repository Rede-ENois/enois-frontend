import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { z } from "zod";

import { ResetPassword } from "@/components/pages/reset-password-page";

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
