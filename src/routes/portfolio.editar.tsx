import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { PortfolioEditorPage } from "@/components/portfolio/portfolio-editor-page";

/**
 * O editor do próprio portfólio. Exige sessão (como a API `/me/portfolio`): quem abre o link sem
 * conta vai para o login.
 */
export const Route = createFileRoute("/portfolio/editar")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.portfolio.editorTitle }] }),
  component: PortfolioEditorRoute,
});

function PortfolioEditorRoute() {
  return (
    <AppContainer>
      <PortfolioEditorPage />
    </AppContainer>
  );
}
