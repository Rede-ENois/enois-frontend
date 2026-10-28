import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * O dock de chat desenha as mini-janelas de conversa que cabem na tela — e só elas.
 *
 * O dock é ancorado à direita e cresce para a ESQUERDA (cada janela tem 22rem). Sem o teto, com
 * 2+ conversas abertas a janela mais à esquerda saía da tela e o botão de fechar dela ficava
 * inalcançável: medido em 2026-10-28 (Chrome headless, DOM real e CSS compilado da QA), a
 * 1024px a primeira janela começava em -32px e a 1280px com 4 janelas em -496px.
 *
 * A conta é do `chat-dock-layout.ts` (com os números de largura travados em teste). Este teste
 * trava o outro lado: o componente tem de usar a lista com o teto, e não a lista crua.
 */
function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

const COMPONENTE = "src/components/chat-dock/chat-dock.tsx";

describe("dock de chat não desenha janela fora da tela", () => {
  it("as janelas desenhadas passam pelo teto de espaço disponível", () => {
    const src = fonte(COMPONENTE);
    expect(src).toContain("janelasQueCabem(");
    expect(src).toContain("janelasVisiveis");
  });

  it("não desenha a lista crua de conversas abertas", () => {
    const src = fonte(COMPONENTE);
    // o `openChats.map` direto é o que desenhava as janelas sem limite
    expect(src).not.toMatch(/\{openChats\.map\(/);
  });

  it("a largura da tela é medida em tempo de execução", () => {
    const src = fonte(COMPONENTE);
    expect(src).toContain("useLarguraDaJanela()");
  });
});
