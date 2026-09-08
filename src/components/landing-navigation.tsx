import { texts } from "@/texts";

export function LandingNavigation() {
  const navigation = [
    { href: "#filosofia", label: texts.landing.nav.philosophy },
    { href: "#recursos", label: texts.landing.nav.features },
    { href: "#comunidade", label: texts.landing.nav.community },
  ];

  return (
    <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
      {navigation.map((item) => (
        <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
          {item.label}
        </a>
      ))}
    </nav>
  );
}
