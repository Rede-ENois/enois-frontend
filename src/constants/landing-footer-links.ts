import { texts } from "@/texts";

export const LANDING_FOOTER_LINKS = [
  { to: "/privacidade", label: texts.landing.footer.privacy },
  { to: "/termos", label: texts.landing.footer.terms },
] as const;
