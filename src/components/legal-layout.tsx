import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { LegalLayout as LegalLayoutView } from "@rede-enois/design-system/domain";

import { anoAtual } from "@/lib/date/format";

import { ThemeToggle } from "@/components/theme-toggle";

const LEGAL_HREFS = {
  home: "/",
  about: "/sobre",
  terms: "/termos",
  privacy: "/privacidade",
  guidelines: "/diretrizes",
};

/** Legal pages shell: the design system layout with the app routes and the theme container. */
export function LegalLayout({ children }: WithRequiredChildren) {
  return (
    <LegalLayoutView year={anoAtual()} hrefs={LEGAL_HREFS} themeToggle={<ThemeToggle />}>
      {children}
    </LegalLayoutView>
  );
}
