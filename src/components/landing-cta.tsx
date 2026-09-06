import { Link } from "@tanstack/react-router";

import { ArrowRight, Heart } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

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
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/entrar" search={{ tab: "signup" }}>
              <Button size="lg" className="gap-2 rounded-full px-6">
                <>{texts.landing.cta.createAccount} </><ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/entrar" search={{ tab: "login" }}>
              <Button size="lg" variant="outline" className="rounded-full px-6">
                {texts.landing.cta.existingAccount}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/60">
            <>{texts.landing.cta.finePrint}</><strong>{texts.landing.cta.freeForever}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
