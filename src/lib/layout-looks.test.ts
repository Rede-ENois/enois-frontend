import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * O look aberto no marketplace não pode esticar os cards da mesma linha (#572).
 *
 * A grade "Looks prontos" do design system é um `grid`; por padrão, os itens de uma linha
 * dividem a altura do mais alto. Abrir as peças de um look fazia os vizinhos crescerem junto —
 * medido em 2026-11-02 (Chrome headless, 1280px): os quatro cards iam de 259px para 706px.
 *
 * A correção é `align-items: start` no grid, no CSS do app. Este teste trava a regra: sem ela,
 * o grid volta ao padrão e o vazio embaixo dos cards vizinhos reaparece.
 */
const CSS = "src/styles.css";

function cssSemComentario(): string {
  return readFileSync(join(process.cwd(), CSS), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** O bloco `.cos-shop__look-grid { ... }` sem nenhum outro seletor colado nele. */
function regraDoGrid(css: string): string | null {
  const match = css.match(/(^|[\s}])\.cos-shop__look-grid\s*\{([^}]*)\}/);
  return match ? match[2] : null;
}

describe("grade de looks do marketplace", () => {
  it("o grid dos looks alinha os cards no topo, sem esticar a linha", () => {
    const regra = regraDoGrid(cssSemComentario());
    expect(regra, "a regra de .cos-shop__look-grid sumiu do CSS").not.toBeNull();
    expect(regra).toMatch(/align-items:\s*start/);
  });
});
