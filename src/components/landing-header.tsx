import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingHeader() {
  const navigation = [
    { href: "#filosofia", label: texts.landing.nav.philosophy },
    { href: "#recursos", label: texts.landing.nav.features },
    { href: "#comunidade", label: texts.landing.nav.community },
  ];
  const authActions = [
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <AppBrand variant="public" />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {authActions.map((action) => (
            <Link key={action.key} to="/entrar" search={{ tab: action.tab }}>
              <Button variant={action.variant} className={action.className}>
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
