import { texts } from "@/texts";
import { Sparkles } from "lucide-react";

import { LandingHeroActions } from "@/components/landing-hero-actions";
import { LandingHeroBenefits } from "@/components/landing-hero-benefits";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-soft)" }}
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-20 text-center sm:pb-32 sm:pt-28">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
          <Sparkles className="h-3 w-3" />

          <>{texts.landing.hero.badge}</>
        </div>

        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          <>{texts.landing.hero.title}</>

          <br />

          <span className="gradient-text">{texts.landing.hero.titleAccent}</span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground">
          {texts.landing.hero.description}
        </p>

        <p className="mt-1 text-sm font-medium text-foreground">{texts.landing.hero.free}</p>

        <LandingHeroActions />
        <LandingHeroBenefits />
      </div>
    </section>
  );
}
