import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";

import { Vagas } from "@/components/pages/jobs-page";

export const Route = createFileRoute("/vagas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.jobs.seoTitle }] }),
  component: Vagas,
});
