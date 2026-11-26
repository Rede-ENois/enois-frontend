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
    expect(picker?.getAttribute("data-enois-reaction-glyph")).toBeNull();
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
});
