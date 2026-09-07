import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight, Heart, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/entrar" search={{ tab: "signup" }}>
            <Button size="lg" className="gap-2 rounded-full px-6">
              <>{texts.landing.hero.join} </>

              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <Link to="/feed">
            <Button size="lg" variant="outline" className="rounded-full px-6">
              {texts.landing.hero.explore}
            </Button>
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-primary/60" />

            <>{texts.landing.hero.benefits.noVanity}</>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/60" />

            <>{texts.landing.hero.benefits.safe}</>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary/60" />

            <>{texts.landing.hero.benefits.freeForever}</>
          </span>
        </div>
      </div>
    </section>
  );
}
