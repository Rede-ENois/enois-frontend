import { useEffect, useRef, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

import { authApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { storeSession } from "@/lib/session";

import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  refreshExpiresAt: z.string().optional(),
  /** Cancelamento ou falha devolvidos pelo provedor (ver finishOAuthError no backend). */
  error: z.string().optional(),
  provider: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  head: () => ({
    meta: buildPageShareTags({ title: texts.auth.social.callbackTitle, path: "/auth/callback" }),
  }),
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
    if (!search.token) {
      setError(texts.auth.social.callbackError);
      return;
    }

    storeSession({
      token: search.token,
      refreshToken: search.refreshToken,
      expiresAt: search.expiresAt,
      refreshExpiresAt: search.refreshExpiresAt,
    });

    // Busca o usuário para o cabeçalho já mostrar nome/foto (o token já está no storage).
    void authApi
      .me()
      .then((user) => storeSession({ token: search.token!, user }))
      .catch(() => undefined)
      .finally(() => navigate({ to: "/feed", replace: true }));
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
  if (normalized.includes("ACCOUNT_EXISTS_LINK_REQUIRED")) {
    return texts.auth.social.accountExists;
  }
  if (normalized.includes("EMAIL_REQUIRED")) {
    return texts.auth.social.emailRequired;
  }
  return texts.auth.social.callbackError;
}
