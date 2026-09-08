import { Link } from "@tanstack/react-router";

import { LANDING_AUTH_ACTIONS } from "@/constants/landing-auth-actions";

import { Button } from "@/components/ui/button";

export function LandingAuthActions() {
  return (
    <>
      {LANDING_AUTH_ACTIONS.map((action) => (
        <Link key={action.key} to="/entrar" search={{ tab: action.tab }}>
          <Button variant={action.variant} className={action.className}>
            {action.label}
          </Button>
        </Link>
      ))}
    </>
  );
}
