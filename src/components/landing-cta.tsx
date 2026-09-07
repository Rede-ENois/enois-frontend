import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingCta() {
  const actions = [
    {
      key: "signup",
      tab: "signup" as const,
      label: texts.landing.cta.createAccount,
      variant: "default" as const,
      icon: ArrowRight,
      className: "gap-2 rounded-full px-6",
    },
    {
      key: "login",
      tab: "login" as const,
      label: texts.landing.cta.existingAccount,
      variant: "outline" as const,
      icon: null,
      className: "rounded-full px-6",
    },
  ];

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
            {actions.map((action) => (
              <Link key={action.key} to="/entrar" search={{ tab: action.tab }}>
                <Button size="lg" variant={action.variant} className={action.className}>
                  <>{action.label}</>

                  {action.icon && <action.icon className="h-4 w-4" />}
                </Button>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground/60">
            <>{texts.landing.cta.finePrint}</>

            <strong>{texts.landing.cta.freeForever}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
