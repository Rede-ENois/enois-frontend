import { describe, expect, it } from "vitest";

import { contextOfPath } from "@/lib/interface-context";

import { navigationItems, navigationItemsFor } from "./navigation-items";

describe("menus das duas interfaces", () => {
  it("o menu social não mostra ferramentas de trabalho e o profissional não mostra convivência", () => {
    const social = navigationItemsFor("SOCIAL").map((item) => item.to);
    const professional = navigationItemsFor("PROFESSIONAL").map((item) => item.to);

    for (const work of [
      "/vagas",
      "/freelances",
      "/empresas",
      "/mentoria",
      "/servicos",
      "/profissional",
    ]) {
      expect(social).not.toContain(work);
      expect(professional).toContain(work);
    }
    for (const community of ["/rede", "/comunidades", "/grupos", "/eventos"]) {
      expect(professional).not.toContain(community);
      expect(social).toContain(community);
    }
    // Início e mensagens existem nas duas (o conteúdo muda com a interface).
    for (const shared of ["/feed", "/mensagens", "/explorar"]) {
      expect(social).toContain(shared);
      expect(professional).toContain(shared);
    }
  });

  it("cada entrada exclusiva abre numa rota da mesma interface (link direto não troca de lado)", () => {
    for (const item of navigationItems) {
      if (item.context === null) continue;
      expect(contextOfPath(item.to), item.to).toBe(item.context);
    }
  });
});
