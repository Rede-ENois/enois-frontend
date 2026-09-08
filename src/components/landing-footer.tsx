import { getLandingFooterCopyright } from "@/utils/components/landing/get-landing-footer-copyright";

import { LandingFooterLinks } from "@/components/landing-footer-links";

export function LandingFooter() {
  const copyright = getLandingFooterCopyright();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>{copyright}</p>

        <LandingFooterLinks />
      </div>
    </footer>
  );
}
