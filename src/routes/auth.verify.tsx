import { useEffect, useRef, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { VerifyStatus } from "@/types/routes/auth/verify-status";
import { Button } from "@rede-enois/design-system/ui";
import { CheckCircle2, Loader2, MailCheck, MailWarning } from "lucide-react";
import { z } from "zod";

import { ApiError, authApi } from "@/lib/api";
import { landingPathFor } from "@/lib/onboarding";
import { hasSessionFlag } from "@/lib/session";
import { storeSession } from "@/lib/session";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: texts.auth.verify.title }] }),
  component: VerifyEmail,
});

/**
 * Tela do link "confirme seu e-mail". A confirmação já devolve a sessão, então quem clica entra
 * direto no app; token expirado, já usado ou inválido tem mensagem própria (com o motivo).
 *
 * O link NÃO é consumido no carregamento da página: a confirmação acontece no clique do botão.
 * Confirmava no `useEffect`, e quem abre o link num leitor de e-mail (o Safe Links do Outlook, o
 * verificador de links do Gmail e de vários gateways corporativos) executa a página e queimava o
 * token — a pessoa clicava de novo e via "link inválido", sem entender que a conta já existia.
 * O botão também deixa o gesto mais honesto: ativar a conta é uma ação da pessoa.
 */
function VerifyEmail() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [landing, setLanding] = useState<"/feed" | "/boas-vindas">("/feed");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Sem token na URL: nada a confirmar.
    if (!search.token) {
      setStatus("invalid");
      return;
    }

    // Com token: a tela espera o clique (o link nao e consumido no carregamento).
    setStatus("confirm");
  }, [search.token]);

  const confirmar = () => {
    if (!search.token) {
      setStatus("invalid");
      return;
    }
    setStatus("verifying");
    void authApi
      .verifyEmail(search.token)
      .then((auth) => {
        storeSession(auth);
        setStatus("done");
        const landing = landingPathFor(auth.user);
        setLanding(landing);
        setTimeout(() => navigate({ to: landing, replace: true }), 1500);
      })
      .catch((error: unknown) => {
        const code = error instanceof ApiError ? error.code : undefined;
        if (code === "TOKEN_EXPIRED") setStatus("expired");
        else if (code === "TOKEN_ALREADY_USED") setStatus("used");
        // O link consumido NAO volta: se a pessoa ja tem sessao, a conta foi confirmada em
        // outra aba (ou o link ja foi usado) — dizer "link invalido" seria errado e
        // mandaria a pessoa pedir outro link sem necessidade.
        else if (code === "INVALID_TOKEN" && hasSessionFlag()) setStatus("used");
        else setStatus("invalid");
      });
  };

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {status === "confirm" && (
          <>
            <MailCheck className="h-9 w-9 text-primary" />

            <h1 className="mt-3 text-lg font-semibold tracking-tight">
              {texts.auth.verify.confirmTitle}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {texts.auth.verify.confirmDescription}
            </p>

            <Button className="mt-6 w-full rounded-full" onClick={confirmar}>
              {texts.auth.verify.confirmButton}
            </Button>
          </>
        )}

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

            <p className="mt-2 text-sm text-muted-foreground">
              {texts.auth.verify.doneDescription}
            </p>

            <Button
              className="mt-6 w-full rounded-full"
              onClick={() => navigate({ to: landing, replace: true })}
            >
              {texts.auth.verify.goToApp}
            </Button>
          </>
        )}

        {status !== "confirm" && status !== "verifying" && status !== "done" && (
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
