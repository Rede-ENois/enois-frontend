import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { SanctionsContainer } from "@/components/moderation/sanctions-container";

export const Route = createFileRoute("/conta-suspensa")({
  head: () => ({ meta: [{ title: texts.sanctions.suspendedSeoTitle }] }),
  component: () => (
    <AppContainer>
      <SanctionsContainer mode="suspended" />
    </AppContainer>
  ),
});
