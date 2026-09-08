import { texts } from "@/texts";

import { LandingFooterLinks } from "@/components/landing-footer-links";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>{texts.landing.footer.copyright(new Date().getFullYear())}</p>

        <LandingFooterLinks />
      </div>
    </footer>
  );
}
