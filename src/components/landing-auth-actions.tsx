import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

export function LandingAuthActions() {
  const actions = [
    {
      key: "login",
      tab: "login" as const,
      label: texts.common.enter,
      variant: "ghost" as const,
      className: "h-8 rounded-full px-3 text-sm",
    },
    {
      key: "signup",
      tab: "signup" as const,
      label: texts.common.createAccount,
      variant: "default" as const,
      className: "h-8 rounded-full px-4 text-sm",
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <Link key={action.key} to="/entrar" search={{ tab: action.tab }}>
          <Button variant={action.variant} className={action.className}>
            {action.label}
          </Button>
        </Link>
      ))}
    </>
  );
}
