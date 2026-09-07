import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

export function LegalDocumentFooter() {
  return (
    <footer className="border-t border-border pt-6 text-sm">
      <p>
        <>{texts.legal.footer.backPrefix}</>

        <Link to="/" className="text-primary hover:underline">
          {texts.legal.footer.home}
        </Link>
      </p>
    </footer>
  );
}
