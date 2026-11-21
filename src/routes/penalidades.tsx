import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { SanctionsContainer } from "@/components/moderation/sanctions-container";

export const Route = createFileRoute("/penalidades")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.sanctions.seoTitle }] }),
  component: () => (
    <AppContainer>
      <SanctionsContainer mode="history" />
    </AppContainer>
  ),
});
