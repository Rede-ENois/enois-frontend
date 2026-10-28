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
 * Este teste trava a regra em todo lugar onde o app mostra o login de uma pessoa.
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
      /<p className="([^"]*)"[^>]*>@?\{item\.username\}/,
    );
    expect(classeDoLogin).toContain("break-words");
  });

  it("a fila de notas do moderador quebra o login", () => {
    const classeDoLogin = classe(
      "src/components/moderation/notes-section.tsx",
      /<p className="([^"]*)"[^>]*>\s*\{note\.authorUsername/,
    );
    expect(classeDoLogin).toContain("break-words");
  });

  it("a fila de jogos do moderador quebra o login", () => {
    const classeDoLogin = classe(
      "src/components/moderation/games-review-section.tsx",
      /<p className="([^"]*)"[^>]*>\s*@\{g\.username/,
    );
    expect(classeDoLogin).toContain("break-words");
  });

  it("a fila de projetos do moderador quebra o login", () => {
    const classeDoLogin = classe(
      "src/components/moderation/projects-review-section.tsx",
      /<p className="([^"]*)"[^>]*>\s*@\{project\.username/,
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

  it("o perfil profissional quebra o login", () => {
    const classeDoLogin = classe(
      "src/routes/profissional_.$username.tsx",
      /<p className="([^"]*)"[^>]*>@?\{data\.username\}/,
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

  it("a lista de contas suspeitas quebra o login (e o item encolhe)", () => {
    const classeDoLogin = classe(
      "src/components/moderation/suspicious-users-section.tsx",
      /<span className="([^"]*)"[^>]*>\s*@\{item\.username\}/,
    );
    expect(classeDoLogin).toContain("break-words");
    expect(classeDoLogin).toContain("min-w-0");
  });

  it("o painel de contribuintes quebra o nome do candidato", () => {
    const classeDoNome = classe(
      "src/components/moderation/contributors-section.tsx",
      /<p className="([^"]*)"[^>]*>\s*\{application\.name\}/,
    );
    expect(classeDoNome).toContain("break-words");
    // item de flex: sem `min-w-0` o nome não encolhe e o painel estouraria do mesmo jeito.
    expect(classeDoNome).toContain("min-w-0");
  });
});
