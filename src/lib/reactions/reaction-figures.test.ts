import { REACTION_TYPES } from "@/types/application/reaction/reaction-type";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ENOIS_CUSTOM_EMOJIS } from "@/lib/emotes/enois-pack";

const STYLES = resolve(dirname(fileURLToPath(import.meta.url)), "../../styles.css");

/** Cada reação é desenhada pelo CSS (`--enois-reaction-img`), não por componente. */
function regraDoCss(type: string): string | null {
  const css = readFileSync(STYLES, "utf8");
  const regra = new RegExp(
    `\\[data-reaction-emoji="${type}"\\],\\s*\\[data-enois-reaction-glyph="${type}"\\] \\{\\s*--enois-reaction-img: url\\("([^"]+)"\\);`,
  );
  return regra.exec(css)?.[1] ?? null;
}

describe("figura de cada reação no styles.css", () => {
  it("toda reação oficial tem a regra que troca o emoji pelo ícone do pacote", () => {
    for (const type of REACTION_TYPES) {
      expect(regraDoCss(type), type).toMatch(/^\/emojis\/enois\/[a-z_]+\.[a-z]+$/);
    }
  });

  it("cada reação aponta para a imagem do MESMO ícone do pacote, na ordem do seletor", () => {
    // O CSS e o pacote contam a mesma história: a reação i é a figura i. Se um dos dois mudar de
    // ordem sozinho, a pílula de uma reação começa a mostrar o rosto de outra.
    for (const [indice, type] of REACTION_TYPES.entries()) {
      expect(regraDoCss(type), type).toBe(ENOIS_CUSTOM_EMOJIS[indice].src);
    }
  });

  it("o coração roxo tem a regra dele, apontando para o próprio arquivo", () => {
    // O tipo entra pela fileira (segundo, ao lado do joinha), e a pílula dele desenha o coração.
    expect(regraDoCss("HEART_PURPLE")).toBe("/emojis/enois/heart_purple.svg");
  });

  it("nenhuma duas reações dividem a mesma figura", () => {
    const figuras = REACTION_TYPES.map((type) => regraDoCss(type));
    expect(new Set(figuras).size).toBe(figuras.length);
  });
});
