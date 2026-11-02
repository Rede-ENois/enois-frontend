import { useEffect, useRef, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Button } from "@rede-enois/design-system/ui";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

import { finishOAuthLogin, oauthCallbackUrl } from "@/lib/oauth-callback";
import { landingPathFor } from "@/lib/onboarding";

const searchSchema = z.object({
  /** Cancelamento ou falha devolvidos pelo provedor (ver finishOAuthError no backend). */
  error: z.string().optional(),
  provider: z.string().optional(),
  /** Chegam quando o redirect_uri registrado no provedor aponta para esta página (LinkedIn). */
  code: z.string().optional(),
  state: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: texts.auth.social.callbackTitle }] }),
  component: OAuthCallback,
});

function OAuthCallback() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    // O efeito roda duas vezes em dev (StrictMode); a troca é idempotente, mas evitamos repetir.
    if (handled.current) return;
    handled.current = true;

    if (search.error) {
      setError(errorMessage(search.error));
      return;
    }

    // LinkedIn está registrado com redirect_uri para esta página: o code/state são trocados no
    // backend, que grava os cookies da sessão e volta para esta página (o mesmo caminho do Google).
    // A URL precisa ser ABSOLUTA (`apiUrl`): o host do front não expõe `/api`, então um caminho
    // relativo cai no 404 do próprio front e o login morre antes de chegar no backend.
    if (search.provider && search.code && search.state) {
      const callbackUrl = oauthCallbackUrl(search.provider, search.code, search.state);
      if (callbackUrl) window.location.replace(callbackUrl);
      else setError(texts.auth.social.callbackError);
      return;
    }

    void finishOAuthLogin().then((user) => {
      if (user) void navigate({ to: landingPathFor(user), replace: true });
      else setError(texts.auth.social.callbackError);
    });
  }, [search, navigate]);

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-5 w-5" />
        </div>

        {error ? (
          <>
            <h1 className="mt-4 text-lg font-semibold tracking-tight">{error}</h1>

            <Button
              className="mt-6 w-full gap-2 rounded-full"
              onClick={() => navigate({ to: "/entrar", search: { tab: "login" } })}
            >
              {texts.common.enter}
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mt-4 h-6 w-6 animate-spin text-primary" />

            <p className="mt-2 text-sm text-muted-foreground">
              {texts.auth.social.callbackLoading}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** O backend devolve `error` na URL quando o provedor cancela ou recusa o login. */
function errorMessage(code: string): string {
  const normalized = code.toUpperCase();
  if (normalized.includes("ACCESS_DENIED") || normalized.includes("USER_CANCELLED")) {
    return texts.auth.social.cancelled;
  }
  // State vencido/consumido (passou dos 15 min no LinkedIn, voltar no navegador ou tentar de
  // novo): a saida e repetir o clique — sempre funciona na primeira.
  if (normalized.includes("INVALID_OAUTH_STATE") || normalized.includes("OAUTH_STATE_EXPIRED")) {
    return texts.auth.social.stateExpired;
  }
  if (normalized.includes("ACCOUNT_EXISTS_LINK_REQUIRED")) {
    return texts.auth.social.accountExists;
  }
  if (normalized.includes("EMAIL_REQUIRED")) {
    return texts.auth.social.emailRequired;
  }
  // LinkedIn recusou a permissao de publicacao (produto "Share on LinkedIn" ainda nao habilitado
  // no aplicativo): o provedor devolve unauthorized_scope_error ANTES do login.
  if (normalized.includes("SCOPE")) {
    return texts.auth.social.linkedinScope;
  }
  return texts.auth.social.callbackError;
}
