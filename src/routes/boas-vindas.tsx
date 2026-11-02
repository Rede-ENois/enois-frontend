import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const Route = createFileRoute("/boas-vindas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.onboarding.seoTitle }] }),
  component: Welcome,
});

function Welcome() {
  return (
    <AppContainer>
      <div className="py-2 sm:py-6">
        <OnboardingFlow />
      </div>
    </AppContainer>
  );
}
