import { texts } from "@/texts";
import { Heart } from "lucide-react";

import { LandingCtaActions } from "@/components/landing-cta-actions";

export function LandingCta() {
  return (
    <section id="comunidade" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <div className="mx-auto max-w-xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Heart className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {texts.landing.cta.title}
          </h2>

          <p className="mt-4 text-muted-foreground">{texts.landing.cta.description}</p>

          <LandingCtaActions />

          <p className="mt-4 text-xs text-muted-foreground/60">
            <>{texts.landing.cta.finePrint}</>

            <strong>{texts.landing.cta.freeForever}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
