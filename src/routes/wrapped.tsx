import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { PageHeader } from "@rede-enois/design-system/ui";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { WrappedContainer } from "@/components/wrapped/wrapped-container";

/**
 * Énóis Wrapped: a retrospectiva anual da própria conta. A view e toda a microcopy vivem no design
 * system; aqui ficam a rota, o cabeçalho e o container que liga os dados. A rota exige sessão — o
 * backend só devolve a retrospectiva de quem está autenticado.
 */
export const Route = createFileRoute("/wrapped")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.wrapped.seoTitle }] }),
  component: WrappedRoute,
});

function WrappedRoute() {
  return (
    <AppContainer>
      <PageHeader title={texts.wrapped.title} description={texts.wrapped.subtitle} />
      <WrappedContainer />
    </AppContainer>
  );
}
