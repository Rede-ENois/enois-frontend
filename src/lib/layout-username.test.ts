import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Login (o `username`) é UMA PALAVRA: o slug sai do nome e troca cada espaço por hífen — mas
 * quem se cadastra com o nome colado ("MariaAparecidaConceicao…") fica com um login sem
 * hífen nenhum, e aí não existe ponto de quebra.
 *
 * Onde o login é mostrado num bloco, a palavra estoura a caixa: o bloco tem a largura do
 * container e o texto, sem espaço, vaza para fora — e a **página inteira passa a rolar de
 * lado no celular**. Onde o login é item de flex, o `min-width: auto` dele é o min-content do
 * login inteiro e o item não encolhe: o mesmo estouro, com a forma diferente.
 *
 * Medido em 2026-10-27 (Chrome headless, 390px, DOM real e CSS compilado da QA): a lista de
 * freelas e a fila de notas do moderador estouravam **34px** com um login de 72 caracteres sem
 * hífen (o formulário de cadastro aceita nome de até 80). Depois de `break-words` — e de
 * `min-w-0` onde o login é item de flex —, zero.
 *
 * Este teste trava a regra nas rotas que mostram o login de uma pessoa; as seções do painel de
 * moderação são views do design system e a regra delas é testada lá.
 */
function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

/** O className do elemento que mostra o login (ou o nome) naquele arquivo. */
function classe(caminho: string, padrao: RegExp): string {
  const achado = fonte(caminho).match(padrao);
  if (!achado) {
    throw new Error(`não achei o elemento em ${caminho}`);
  }
  return achado[1] ?? "";
}

describe("login longo não pode estourar a tela", () => {
  it("a lista de freelas quebra o login", () => {
    const classeDoLogin = classe(
      "src/routes/freelances.tsx",
      /params=\{\{ username: item\.username \}\}\s+className="([^"]*)"/,
    );
    expect(classeDoLogin).toContain("break-words");
  });

  it("a triagem de post do moderador quebra o login", () => {
    const classeDoLogin = classe(
      "src/routes/moderacao.tsx",
      /<p className="([^"]*)"[^>]*>\s*@\{g\.username/,
    );
    expect(classeDoLogin).toContain("break-words");
  });

  it("o perfil de quem faz jogos quebra o login", () => {
    const classeDoLogin = classe(
      "src/routes/games.$username.tsx",
      /<p className="([^"]*)"[^>]*>\s*@\{dev\.username/,
    );
    expect(classeDoLogin).toContain("break-words");
  });
});
