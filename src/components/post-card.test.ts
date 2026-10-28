import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

describe("cabeçalho do card de post", () => {
  it("mantém as classes de redução de largura e quebra de linha", () => {
    const conteudo = fonte("src/components/post-card.tsx");
    const header = conteudo.match(/<header className="([^"]*)"/);

    expect(header).not.toBeNull();
    expect(header![1]).toContain("min-w-0");
    expect(header![1]).toContain("sm:flex-wrap");
  });
});
