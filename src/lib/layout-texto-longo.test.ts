import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Texto do usuário sem espaços não tem onde quebrar — e a página passa a rolar de lado.
 *
 * Título de jogo, nome de projeto, assunto de ticket, título de PR: são palavras que a pessoa
 * escreve coladas (sem espaço, sem hífen) e o navegador não tem ponto de quebra. A palavra
 * estoura a caixa e a **página inteira passa a rolar de lado no celular**.
 *
 * Medido em 2026-10-27 (Chrome headless, 390px e 1280px, DOM real e CSS compilado da QA): a
 * fila de jogos, a de projetos, a de PRs, a de contribuições e a de tickets do painel de
 * moderador estouravam de 424px a 586px.
 *
 * A correção é de raiz, no CSS do app: `overflow-wrap: break-word` nos elementos de texto. É
 * melhor do que repetir `break-words` em cada componente, porque o texto do usuário aparece em
 * dezenas de lugares e qualquer um deles pode receber a palavra colada.
 *
 * Este teste trava a regra no CSS — sem ela, o texto volta a estourar a tela.
 */
function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

/** O CSS sem os comentários: o texto do comentário fala das regras, e não é declaração. */
function cssSemComentario(): string {
  return fonte(CSS)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const CSS = "src/styles.css";

describe("texto do usuário sem espaços não pode estourar a tela", () => {
  it("o CSS do app quebra a palavra que não cabe na linha", () => {
    const css = fonte(CSS);
    expect(css).toMatch(/overflow-wrap:\s*break-word/);
  });

  it("a regra vale para os elementos de texto (p, span, títulos, li, link)", () => {
    const css = fonte(CSS);
    const bloco = css.match(/@layer base\s*\{([\s\S]*?)\}/);
    expect(bloco, "a regra tem de estar na camada base").not.toBeNull();

    const seletores = bloco![1];
    for (const tag of ["p", "span", "h1", "h2", "h3", "li", "a", "label", "strong"]) {
      expect(seletores).toMatch(new RegExp(`(^|[\\s,])${tag}([\\s,])`));
    }
  });

  it("a regra fica na camada base, para as utilities poderem sobrescrever", () => {
    // `truncate`, `line-clamp` e `break-all` são utilities: se a regra viesse depois delas,
    // o app não conseguiria mais cortar um texto de propósito.
    const css = fonte(CSS);
    const posBase = css.indexOf("@layer base");
    expect(posBase).toBeGreaterThan(-1);
    // a regra precisa estar DEPOIS do import do design system (que é quem define o resto)
    const posImport = css.indexOf('@import "@rede-enois/design-system/styles.css"');
    expect(posImport).toBeGreaterThan(-1);
    expect(posBase).toBeGreaterThan(posImport);
  });

  it("não usa word-break: break-all, que quebraria toda palavra", () => {
    // `break-all` quebra a palavra mesmo quando ela cabe na linha; `break-word` só quebra
    // quando a palavra não cabe. O app usa `break-all` de propósito em dois lugares (e-mail e
    // login), mas a regra geral não pode impôr-lo.
    expect(cssSemComentario()).not.toMatch(/word-break:\s*break-all/);
  });
});
