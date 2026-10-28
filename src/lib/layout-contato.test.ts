import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contato do painel de contribuintes: login do GitHub e e-mail são texto do usuário e não têm
 * espaço em que quebrar.
 *
 * Item de flex nasce com `min-width: auto`, ou seja, o mínimo dele é o **min-content** do
 * conteúdo — e o min-content de um e-mail é o e-mail inteiro. Com um e-mail de verdade
 * (`maria.aparecida.goncalves.de.albuquerque.santoro@exemplo.com.br`) o link ficava 401px
 * dentro de uma tela de 390px: a **página passava a rolar de lado no celular**.
 *
 * Medido em 2026-10-27 (Chrome headless, 390px, com o CSS compilado da QA): 40px de transbordo
 * antes, zero depois de `min-w-0` + `break-all` no link (o `break-words` sozinho não resolve,
 * porque não muda o cálculo do min-content) e `shrink-0` no ícone, que não pode ser espremido
 * quando o texto quebra em duas linhas.
 *
 * Este teste trava a regra nos dois links: quem mexer no contato de novo precisa manter a quebra.
 */
function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

const ARQUIVO = "src/components/moderation/contributors-section.tsx";

describe("contato do painel de contribuintes", () => {
  it("o link do GitHub encolhe e quebra o login longo", () => {
    const conteudo = fonte(ARQUIVO);
    const link = conteudo.match(
      /<a\s+href=\{`https:\/\/github\.com\/\$\{application\.github\}`\}[\s\S]*?className="([^"]*)"/,
    );
    expect(link).not.toBeNull();
    expect(link![1]).toContain("min-w-0");
    expect(link![1]).toContain("break-all");
  });

  it("o link do e-mail encolhe e quebra o e-mail longo", () => {
    const conteudo = fonte(ARQUIVO);
    const link = conteudo.match(
      /<a\s+href=\{`mailto:\$\{application\.email\}`\}[\s\S]*?className="([^"]*)"/,
    );
    expect(link).not.toBeNull();
    expect(link![1]).toContain("min-w-0");
    expect(link![1]).toContain("break-all");
  });

  it("os ícones do contato não são espremidos quando o texto quebra", () => {
    const conteudo = fonte(ARQUIVO);
    const icones = conteudo.match(/<(GithubIcon|Mail) className="([^"]*)"/g) ?? [];
    expect(icones.length).toBe(2);
    for (const icone of icones) {
      expect(icone).toContain("shrink-0");
    }
  });
});
