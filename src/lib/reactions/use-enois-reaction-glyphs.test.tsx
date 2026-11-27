// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveReactionTypeFromGlyph, useEnoisReactionGlyphs } from "./use-enois-reaction-glyphs";

function Harness({ glyph }: { glyph: string }) {
  useEnoisReactionGlyphs();
  return (
    <div>
      <span data-testid="pill">{glyph}</span>

      <span data-testid="picker" data-reaction-emoji="LIKE">
        👍
      </span>

      <div contentEditable suppressContentEditableWarning data-testid="editor">
        <span>👍</span>
      </div>

      <code data-testid="code">
        <span>👍</span>
      </code>
    </div>
  );
}

describe("useEnoisReactionGlyphs", () => {
  let host: HTMLDivElement;
  let root: Root | null = null;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root?.unmount());
    host.remove();
  });

  it("resolveReactionTypeFromGlyph reconhece emojis com e sem variation selector", () => {
    expect(resolveReactionTypeFromGlyph("👍")).toBe("LIKE");
    expect(resolveReactionTypeFromGlyph("❤️")).toBe("LOVE");
    expect(resolveReactionTypeFromGlyph("❤")).toBe("LOVE");
    expect(resolveReactionTypeFromGlyph("texto comum")).toBeNull();
    // O valor de `emojis[HEART_PURPLE]` é o caminho da figura: pintar o caminho como texto é o bug.
    expect(resolveReactionTypeFromGlyph("/emojis/enois/heart_purple.svg")).toBeNull();
  });

  it("marca e atualiza data-enois-reaction-glyph sem tocar em picker ou áreas editáveis", async () => {
    await act(async () => {
      root?.render(<Harness glyph="👍" />);
    });

    const pill = host.querySelector('[data-testid="pill"]');
    const picker = host.querySelector('[data-testid="picker"]');
    const editorSpan = host.querySelector('[data-testid="editor"] span');
    const codeSpan = host.querySelector('[data-testid="code"] span');

    expect(pill?.getAttribute("data-enois-reaction-glyph")).toBe("LIKE");
    // O seletor também é pintado pelo CSS; a marca dele não muda o texto.
    expect(picker?.getAttribute("data-enois-reaction-glyph")).toBe("LIKE");
    expect(picker?.textContent).toBe("👍");
    expect(editorSpan?.getAttribute("data-enois-reaction-glyph")).toBeNull();
    expect(codeSpan?.getAttribute("data-enois-reaction-glyph")).toBeNull();

    await act(async () => {
      root?.render(<Harness glyph="❤️" />);
    });
    expect(pill?.getAttribute("data-enois-reaction-glyph")).toBe("LOVE");

    await act(async () => {
      root?.render(<Harness glyph="Curtir" />);
    });
    expect(pill?.getAttribute("data-enois-reaction-glyph")).toBeNull();
  });

  it("substitui o emoji antigo no tooltip (title) das pílulas e do seletor pelo nome da reação", async () => {
    function TooltipHarness() {
      useEnoisReactionGlyphs();
      return (
        <div>
          <button type="button" title="Remover reação 👍" aria-label="Remover reação 👍">
            <span>👍</span>
          </button>

          <button type="button" data-reaction-emoji="LIKE" title="like">
            👍
          </button>
        </div>
      );
    }

    await act(async () => {
      root?.render(<TooltipHarness />);
    });

    const pillButton = host.querySelector('button[aria-label="Remover reação 👍"]');
    const pickerButton = host.querySelector('button[data-reaction-emoji="LIKE"]');
    expect(pillButton?.getAttribute("title")).toBe("Remover reação Joinha É Nóis");
    expect(pickerButton?.getAttribute("title")).toBe("Joinha É Nóis");
  });

  it("reconhece a pílula do coração roxo e põe o nome dele no tooltip", async () => {
    // O coração roxo não está na lista das 76 expressões, mas a pílula dele tem que desenhar o
    // coração (CSS) e o tooltip não pode continuar com o emoji cru.
    function HeartHarness() {
      useEnoisReactionGlyphs();
      return (
        <div>
          <span data-testid="pill">💜</span>

          <button type="button" data-reaction-emoji="HEART_PURPLE" title="💜">
            💜
          </button>
        </div>
      );
    }

    await act(async () => {
      root?.render(<HeartHarness />);
    });

    expect(resolveReactionTypeFromGlyph("💜")).toBe("HEART_PURPLE");
    expect(
      host.querySelector('[data-testid="pill"]')?.getAttribute("data-enois-reaction-glyph"),
    ).toBe("HEART_PURPLE");
    expect(
      host.querySelector('button[data-reaction-emoji="HEART_PURPLE"]')?.getAttribute("title"),
    ).toBe("Coração roxo");
  });

  it("o coração roxo do seletor sai do caminho do arquivo e ganha o emoji da figura", async () => {
    // O valor de `emojis[HEART_PURPLE]` é o caminho da figura: o botão ficava sem figura (o CSS
    // pinta pelo emoji) e sem nome para o leitor de tela.
    function PickerHarness() {
      useEnoisReactionGlyphs();
      return (
        <div>
          <button type="button" data-reaction-emoji="HEART_PURPLE" title="heart_purple">
            /emojis/enois/heart_purple.svg
          </button>
        </div>
      );
    }

    await act(async () => {
      root?.render(<PickerHarness />);
    });

    const coracao = host.querySelector('button[data-reaction-emoji="HEART_PURPLE"]');
    expect(coracao?.textContent).toBe("💜");
    expect(coracao?.getAttribute("title")).toBe("Coração roxo");
  });

  it("lista de quem reagiu e abas desenham o coração roxo como glifo, não como código", async () => {
    // O diálogo de reações pode desenhar o valor de `emojis[type]` como texto; o código da rede é
    // `:enois_heart_purple:`, e abstrações dele (`HEART_PURPLE`, `heart_purple`) também não podem
    // aparecer escritas na pílula (print da Mel).
    function DialogHarness() {
      useEnoisReactionGlyphs();
      return (
        <ul>
          <li data-testid="row-texto">
            <span>:enois_heart_purple:</span>
          </li>

          <li data-testid="row-code">
            <span>HEART_PURPLE</span>
          </li>

          <li data-testid="row-curto">
            <span>heart_purple</span>
          </li>

          {/* O que o texto publicado guarda: o caminho do arquivo da figura. */}
          <li data-testid="row-arquivo">
            <span>/emojis/enois/heart_purple.svg</span>
          </li>

          <li data-testid="row-name">
            <span>Marina Rocha</span>
          </li>
        </ul>
      );
    }

    await act(async () => {
      root?.render(<DialogHarness />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    for (const id of ["row-texto", "row-code", "row-curto", "row-arquivo"]) {
      const glifo = host.querySelector(`[data-testid="${id}"] span`);
      expect(glifo?.getAttribute("data-enois-reaction-glyph")).toBe("HEART_PURPLE");
      expect(glifo?.textContent).toBe("💜");
    }
    expect(
      host
        .querySelector('[data-testid="row-name"] span')
        ?.hasAttribute("data-enois-reaction-glyph"),
    ).toBe(false);
    expect(host.querySelector('[data-testid="row-name"] span')?.textContent).toBe("Marina Rocha");
  });
});
