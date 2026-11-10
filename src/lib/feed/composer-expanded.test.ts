import { describe, expect, it } from "vitest";

import { composerExpanded } from "./composer-expanded";

const resting = { open: false, draft: "", mediaCount: 0, postType: "INSIGHT" };

describe("composerExpanded", () => {
  it("descansa em uma linha quando nada foi começado", () => {
    expect(composerExpanded(resting)).toBe(false);
  });

  it("descansa com o tipo do feed corporativo, que o seletor aplica sozinho", () => {
    // Antes (defeito): BUSINESS contava como "em andamento", então a conta profissional via o
    // compositor inteiro ocupando a primeira tela para sempre e o launcher nunca aparecia.
    expect(composerExpanded({ ...resting, postType: "BUSINESS" })).toBe(false);
  });

  it("abre quando há rascunho, mídia, atalho de abertura ou outro tipo", () => {
    expect(composerExpanded({ ...resting, draft: "  olá  " })).toBe(true);
    expect(composerExpanded({ ...resting, draft: "   " })).toBe(false);
    expect(composerExpanded({ ...resting, mediaCount: 1 })).toBe(true);
    expect(composerExpanded({ ...resting, open: true })).toBe(true);
    for (const postType of ["ARTICLE", "QUESTION", "POLL", "PAGE", "MOMENT"]) {
      expect(composerExpanded({ ...resting, postType })).toBe(true);
    }
  });
});
