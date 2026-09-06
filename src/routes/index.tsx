import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { LandingCta } from "@/components/landing-cta";
import { LandingFeatures } from "@/components/landing-features";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { LandingHero } from "@/components/landing-hero";
import { LandingPhilosophy } from "@/components/landing-philosophy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: texts.landing.seo.title },
      { name: "description", content: texts.landing.seo.description },
      { property: "og:title", content: texts.landing.seo.title },
      { property: "og:description", content: texts.landing.seo.ogDescription },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <LandingHero />
      <LandingPhilosophy />
      <LandingFeatures />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
