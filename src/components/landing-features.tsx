import { LANDING_FEATURES } from "@/constants/components/landing/landing-features";

import { LandingFeaturesHeader } from "@/components/landing-features-header";
import { LandingInfoCard } from "@/components/landing-info-card";

export function LandingFeatures() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <LandingFeaturesHeader />

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature) => (
          <LandingInfoCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
