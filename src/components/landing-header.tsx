import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <AppBrand variant="public" />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#filosofia" className="transition-colors hover:text-foreground">
            {texts.landing.nav.philosophy}
          </a>

          <a href="#recursos" className="transition-colors hover:text-foreground">
            {texts.landing.nav.features}
          </a>

          <a href="#comunidade" className="transition-colors hover:text-foreground">
            {texts.landing.nav.community}
          </a>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <Link to="/entrar" search={{ tab: "login" }}>
            <Button variant="ghost" className="h-8 rounded-full px-3 text-sm">
              {texts.common.enter}
            </Button>
          </Link>

          <Link to="/entrar" search={{ tab: "signup" }}>
            <Button className="h-8 rounded-full px-4 text-sm">{texts.common.createAccount}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
