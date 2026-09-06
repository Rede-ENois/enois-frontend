import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>{texts.landing.footer.copyright(new Date().getFullYear())}</p>
        <div className="flex gap-5">
          <Link to="/privacidade" className="transition-colors hover:text-foreground">
            {texts.landing.footer.privacy}
          </Link>
          <Link to="/termos" className="transition-colors hover:text-foreground">
            {texts.landing.footer.terms}
          </Link>
          <a href="#" className="transition-colors hover:text-foreground">
            {texts.landing.footer.contact}
          </a>
        </div>
      </div>
    </footer>
  );
}
