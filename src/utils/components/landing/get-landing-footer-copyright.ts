import { texts } from "@/texts";

export function getLandingFooterCopyright() {
  return texts.landing.footer.copyright(new Date().getFullYear());
}
