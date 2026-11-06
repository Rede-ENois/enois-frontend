// @vitest-environment jsdom
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { routeTree } from "@/routeTree.gen";
import { describe, expect, it } from "vitest";

/**
 * Sem o `_` no nome do arquivo, esta rota vira filha de `/conta` — e a `AccountSettingsPage` não
 * tem `<Outlet/>`, então clicar na linha muda a URL e a tela continua sendo a de configurações.
 * Este teste usa a árvore real de rotas (não um router mockado) para pegar essa regressão.
 */
describe("rota de preferências de feed", () => {
  it("abre em /conta/preferencias-feed sem aninhar na página de conta", () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
    });

    const matches = router.matchRoutes("/conta/preferencias-feed");

    expect(matches.map((match) => match.routeId)).toEqual([
      "__root__",
      "/conta_/preferencias-feed",
    ]);
  });
});
