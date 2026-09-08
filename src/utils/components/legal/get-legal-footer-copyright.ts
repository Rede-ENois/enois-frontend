import { texts } from "@/texts";

export function getLegalFooterCopyright() {
  return texts.legal.footer.copyright(new Date().getFullYear());
}
