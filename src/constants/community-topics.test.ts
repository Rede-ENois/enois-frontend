import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { topicLabel } from "./community-topics";

/**
 * A API devolve o assunto como **código** ("TECNOLOGIA", "CARREIRA") e a tela mostra a **palavra**
 * ("Tecnologia", "Carreira"). Em 2026-10-24 o card da comunidade e a página de detalhe mostravam o
 * código cru — na mesma tela em que o filtro de assuntos mostrava a palavra (captura de tela na
 * QA: card com "CARREIRA" e chip "Tecnologia" lado a lado).
 *
 * Além disso, a API manda `topic: null` para a comunidade sem assunto: o campo é anulável e o tipo
 * do front dizia que não era.
 */
describe("rótulo do assunto", () => {
  it("traduz o código da API na palavra", () => {
    expect(topicLabel("TECNOLOGIA")).toBe("Tecnologia");
    expect(topicLabel("CARREIRA")).toBe("Carreira");
  });

  /** A #725 pediu o assunto "Desabafo": o rótulo tem que existir nos dois lados da API. */
  it("traduz o assunto desabafo", () => {
    expect(topicLabel("DESABAFO")).toBe("Desabafo");
  });

  /**
   * Ampliação de 2026-11-17: nichos que a rede pediu (pets já existia; meio ambiente foi o
   * pedido explícito). O rótulo tem que existir do lado do app — o backend rejeita o assunto
   * que só um lado conhece.
   */
  it("traduz os oito assuntos da ampliação de 2026-11-17", () => {
    expect(topicLabel("MEIO_AMBIENTE")).toBe("Meio ambiente");
    expect(topicLabel("ANIMAIS")).toBe("Animais");
    expect(topicLabel("CULINARIA")).toBe("Culinária");
    expect(topicLabel("JARDINAGEM")).toBe("Jardinagem");
    expect(topicLabel("ARTESANATO")).toBe("Artesanato");
    expect(topicLabel("HISTORIA")).toBe("História");
    expect(topicLabel("FILOSOFIA")).toBe("Filosofia");
    expect(topicLabel("IDIOMAS")).toBe("Idiomas");
  });

  it("não mostra nada em comunidade sem assunto", () => {
    expect(topicLabel(null)).toBeNull();
    expect(topicLabel(undefined)).toBeNull();
  });

  it("cai no próprio código quando a API inventar um assunto novo", () => {
    // Melhor o código solto do que um rótulo vazio: o assunto aparece e se lê.
    expect(topicLabel("ASSUNTO_NOVO" as never)).toBe("ASSUNTO_NOVO");
  });
});

describe("telas de comunidade", () => {
  const telas = ["src/components/community-card.tsx", "src/routes/comunidades.$communityId.tsx"];

  it.each(telas)("%s não mostra o código cru do assunto", (arquivo) => {
    const fonte = readFileSync(join(process.cwd(), arquivo), "utf8");
    expect(fonte).not.toMatch(/\{(c|live|community)\.topic\}/);
    expect(fonte).toContain("topicLabel(");
  });
});
