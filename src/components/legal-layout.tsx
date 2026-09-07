import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { WithRequiredChildren } from "@/types/components/with-required-children";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function LegalLayout({ children }: WithRequiredChildren) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <AppBrand variant="public" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="surface-card space-y-8 p-6 sm:p-10">{children}</div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:px-6">
          <p>{texts.legal.footer.copyright(new Date().getFullYear())}</p>

          <nav className="flex items-center gap-4">
            <Link to="/termos" className="transition-colors hover:text-foreground">
              {texts.legal.footer.terms}
            </Link>

            <Link to="/privacidade" className="transition-colors hover:text-foreground">
              {texts.legal.footer.privacy}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
