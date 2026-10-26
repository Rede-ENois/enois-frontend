import { GuestAppHeader as GuestAppHeaderView } from "@rede-enois/design-system/domain";

import { ThemeToggle } from "@/components/theme-toggle";

/** Visitor header: the design system view with the app routes and the theme container. */
export function GuestAppHeader() {
  return (
    <GuestAppHeaderView
      homeHref="/feed"
      loginHref="/entrar?tab=login"
      themeToggle={<ThemeToggle />}
    />
  );
}
