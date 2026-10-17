import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight, LifeBuoy, Mail } from "lucide-react";

import { supportApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { isAuthenticated } from "@/lib/use-auth";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { SupportForm } from "@/components/support-form";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: buildPageShareTags({ title: texts.support.contatoSeoTitle, path: "/contato" }),
  }),
  component: Contato,
});

/**
 * Canal de contato real (o link do rodape apontava para "#").
 *
 * Com sessao, mostra o formulario que abre um pedido para uma pessoa do time. Sem sessao, explica o
 * caminho e oferece o e-mail do time quando ele existe — ninguem fica sem um canal.
 */
function Contato() {
  const authenticated = isAuthenticated();

  if (authenticated) {
    return (
      <AppContainer>
        <div className="mx-auto w-full max-w-2xl">
          <div className="surface-card p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />

              <h1 className="text-2xl font-semibold tracking-tight">{texts.support.title}</h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">{texts.support.subtitle}</p>

            <SupportForm />
          </div>
        </div>
      </AppContainer>
    );
  }

  return <GuestContact />;
}

function GuestContact() {
  const { data } = useQuery({
    queryKey: ["support-config"],
    queryFn: () => supportApi.config(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" />

          <h1 className="text-2xl font-semibold tracking-tight">{texts.support.contactTitle}</h1>
        </div>

        <p className="text-sm text-muted-foreground">{texts.support.contactDescription}</p>

        <div className="surface-card space-y-4 p-4 sm:p-6">
          <h2 className="text-base font-medium">{texts.support.contactAccountTitle}</h2>

          <p className="text-sm text-muted-foreground">{texts.support.contactAccountDescription}</p>

          <div className="flex flex-wrap gap-3">
            <Link to="/entrar" search={{ tab: "signup" }}>
              <Button className="gap-2 rounded-full">
                <>{texts.common.createAccount} </>

                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link to="/entrar" search={{ tab: "login" }}>
              <Button variant="outline" className="rounded-full">
                {texts.common.enter}
              </Button>
            </Link>
          </div>
        </div>

        {data?.email && (
          <div className="surface-card space-y-3 p-4 sm:p-6">
            <h2 className="text-base font-medium">{texts.support.contactEmailTitle}</h2>

            <p className="text-sm text-muted-foreground">{texts.support.contactEmailDescription}</p>

            <a
              href={`mailto:${data.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              <Mail className="h-4 w-4" />

              <>{data.email}</>
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/termos" className="hover:text-foreground">
            {texts.landing.footer.terms}
          </Link>

          <Link to="/privacidade" className="hover:text-foreground">
            {texts.landing.footer.privacy}
          </Link>

          <Link to="/" className="hover:text-foreground">
            {texts.landing.footer.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
