import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { Vagas } from "@/components/pages/jobs-page";

export const Route = createFileRoute("/vagas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.jobs.seoTitle }] }),
  component: Vagas,
});
