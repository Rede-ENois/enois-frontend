import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

export function AuthLegalNotice() {
  return (
    <p className="mt-6 text-center text-xs text-muted-foreground">
      <>{texts.auth.terms.prefix}</>

      <Link to="/termos" className="text-primary hover:underline">
        {texts.auth.terms.terms}
      </Link>

      <>{texts.auth.terms.conjunction}</>

      <Link to="/privacidade" className="text-primary hover:underline">
        {texts.auth.terms.privacy}
      </Link>

      <>{texts.auth.terms.end}</>
    </p>
  );
}
