import { Link } from "@tanstack/react-router";

import { LANDING_FOOTER_LINKS } from "@/constants/landing-footer-links";
import { texts } from "@/texts";

export function LandingFooterLinks() {
  return (
    <div className="flex gap-5">
      {LANDING_FOOTER_LINKS.map((item) => (
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
