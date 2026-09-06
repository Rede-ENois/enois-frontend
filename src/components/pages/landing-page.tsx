import { LandingCta } from "@/components/landing-cta";
import { LandingFeatures } from "@/components/landing-features";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { LandingHero } from "@/components/landing-hero";
import { LandingPhilosophy } from "@/components/landing-philosophy";

export function Landing() {
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
