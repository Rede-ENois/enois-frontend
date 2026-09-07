import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { Mentoria } from "@/components/pages/mentoring-page";

export const Route = createFileRoute("/mentoria")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.mentoring.seoTitle }] }),
  component: Mentoria,
});
