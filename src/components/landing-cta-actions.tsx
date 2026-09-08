import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingCtaActions() {
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
  );
}
