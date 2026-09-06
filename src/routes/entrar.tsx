import { createFileRoute } from "@tanstack/react-router";

import { z } from "zod";

import { texts } from "@/texts";

import { Auth } from "@/components/pages/auth-page";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional().default("signup"),
});

export const Route = createFileRoute("/entrar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: texts.auth.seo.authTitle },
      {
        name: "description",
        content: texts.auth.seo.authDescription,
      },
    ],
  }),
  component: Auth,
});
