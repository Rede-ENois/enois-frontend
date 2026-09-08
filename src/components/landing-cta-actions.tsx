import { Link } from "@tanstack/react-router";

import { LANDING_CTA_ACTIONS } from "@/constants/landing-cta-actions";

import { Button } from "@/components/ui/button";

export function LandingCtaActions() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {LANDING_CTA_ACTIONS.map((action) => (
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
