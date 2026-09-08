import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

export function LandingFooterLinks() {
  const links = [
    { to: "/privacidade" as const, label: texts.landing.footer.privacy },
    { to: "/termos" as const, label: texts.landing.footer.terms },
  ];

  return (
    <div className="flex gap-5">
      {links.map((item) => (
        <Link key={item.to} to={item.to} className="transition-colors hover:text-foreground">
          {item.label}
        </Link>
      ))}

      <a href="#" className="transition-colors hover:text-foreground">
        {texts.landing.footer.contact}
      </a>
    </div>
  );
}
