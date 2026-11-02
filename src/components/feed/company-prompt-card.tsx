import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Button } from "@rede-enois/design-system/ui";
import { Building2, X } from "lucide-react";

import { companiesApi } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

const DISMISS_KEY = "enois-dismiss-company-card";

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Card na sidebar do feed que convida a criar uma pagina de empresa.
 * Aparece so pra quem esta logado, nao tem empresa e nao dispensou.
 */
export function CompanyPromptCard() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(isDismissed);

  const { data: myCompanies, isLoading } = useQuery({
    queryKey: ["companies", "mine"],
    queryFn: () => companiesApi.mine(),
    enabled: Boolean(user) && !dismissed,
  });

  if (dismissed || !user || isLoading || (myCompanies && myCompanies.length > 0)) {
    return null;
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // storage bloqueado — some so nesta sessao
    }
    setDismissed(true);
  };

  return (
    <div className="relative rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label={texts.feed.companyPrompt.dismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-text-subtle transition hover:bg-surface-2 hover:text-text-strong"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-text-strong">{texts.feed.companyPrompt.title}</p>

          <p className="text-xs text-text-subtle">{texts.feed.companyPrompt.description}</p>
        </div>
      </div>

      <Link to="/empresas" className="mt-3 block">
        <Button variant="outline" size="sm" className="w-full rounded-full">
          {texts.feed.companyPrompt.cta}
        </Button>
      </Link>
    </div>
  );
}
