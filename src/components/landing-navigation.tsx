import { LANDING_NAVIGATION_ITEMS } from "@/constants/landing-navigation-items";

export function LandingNavigation() {
  return (
    <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
      {LANDING_NAVIGATION_ITEMS.map((item) => (
        <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
          {item.label}
        </a>
      ))}
    </nav>
  );
}
