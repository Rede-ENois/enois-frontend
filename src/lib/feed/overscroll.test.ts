// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O gesto de puxar para renovar do feed só existe se o navegador não o disputar: sem
 * `overscroll-behavior-y: none` no documento, o Chrome Mobile executa o pull-to-refresh NATIVO e
 * recarrega a página inteira por cima do `useFeedPullToRefresh` (a pessoa perde a posição, a aba
 * e o estado). A regra é global (documento inteiro), então a prova é sobre o CSS compilado do app.
 */
describe("overscroll do documento", () => {
  const css = readFileSync(fileURLToPath(new URL("../../styles.css", import.meta.url)), "utf8");

  it("bloqueia o pull-to-refresh nativo do navegador no html", () => {
    expect(css).toMatch(/html\s*\{[^}]*overscroll-behavior-y:\s*none/);
  });
});
