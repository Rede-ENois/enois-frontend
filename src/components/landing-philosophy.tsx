import { LANDING_PHILOSOPHY_VALUES } from "@/constants/components/landing/landing-philosophy-values";

import { LandingInfoCard } from "@/components/landing-info-card";
import { LandingPhilosophyFreeBadge } from "@/components/landing-philosophy-free-badge";
import { LandingPhilosophyHeader } from "@/components/landing-philosophy-header";

export function LandingPhilosophy() {
  return (
    <section id="filosofia" className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <LandingPhilosophyHeader />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {LANDING_PHILOSOPHY_VALUES.map((value) => (
            <LandingInfoCard key={value.title} {...value} />
          ))}
        </div>

        <LandingPhilosophyFreeBadge />
      </div>
    </section>
  );
}
