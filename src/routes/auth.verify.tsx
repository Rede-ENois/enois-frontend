import { useEffect, useRef, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { z } from "zod";

import { ApiError, authApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { storeSession } from "@/lib/session";

import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify")({
  validateSearch: searchSchema,
  head: () => ({
    meta: buildPageShareTags({ title: texts.auth.verify.title, path: "/auth/verify" }),
  }),
  component: VerifyEmail,
});

type Status = "verifying" | "done" | "invalid" | "used" | "expired";

/**
 * Tela do link "confirme seu e-mail". A confirmação já devolve a sessão, então quem clica entra
 * direto no app; token expirado, já usado ou inválido tem mensagem própria (com o motivo).
 */
function VerifyEmail() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (!search.token) {
      setStatus("invalid");
      return;
    }

    void authApi
      .verifyEmail(search.token)
      .then((auth) => {
        storeSession(auth);
        setStatus("done");
        setTimeout(() => navigate({ to: "/feed", replace: true }), 1500);
      })
      .catch((error: unknown) => {
        const code = error instanceof ApiError ? error.code : undefined;
        if (code === "TOKEN_EXPIRED") setStatus("expired");
        else if (code === "TOKEN_ALREADY_USED") setStatus("used");
        else setStatus("invalid");
      });
  }, [search.token, navigate]);

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-primary" />

            <p className="mt-3 text-sm text-muted-foreground">{texts.auth.verify.verifying}</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle2 className="h-9 w-9 text-growth" />

            <h1 className="mt-3 text-lg font-semibold tracking-tight">
              {texts.auth.verify.doneTitle}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">{texts.auth.verify.doneDescription}</p>

            <Button
              className="mt-6 w-full rounded-full"
              onClick={() => navigate({ to: "/feed", replace: true })}
            >
              {texts.auth.verify.goToApp}
            </Button>
          </>
        )}

        {status !== "verifying" && status !== "done" && (
          <>
            <MailWarning className="h-9 w-9 text-destructive" />

            <h1 className="mt-3 text-lg font-semibold tracking-tight">
              {status === "expired"
                ? texts.auth.verify.expiredTitle
                : status === "used"
                  ? texts.auth.verify.usedTitle
                  : texts.auth.verify.invalidTitle}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {status === "expired"
                ? texts.auth.verify.expiredDescription
                : status === "used"
                  ? texts.auth.verify.usedDescription
                  : texts.auth.verify.invalidDescription}
            </p>

            <Button
              className="mt-6 w-full rounded-full"
              onClick={() => navigate({ to: "/entrar", search: { tab: "login" } })}
            >
              {texts.auth.verify.resend}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
