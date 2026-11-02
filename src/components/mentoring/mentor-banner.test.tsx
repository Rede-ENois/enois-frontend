// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentorBanner } from "./mentor-banner";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string) => `cdn:${url}` }));

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.replaceChildren();
});

describe("MentorBanner", () => {
  it("mostra a imagem inteira: sem altura fixa e sem recorte", () => {
    act(() => root!.render(<MentorBanner src="banner.png" />));

    const img = container.querySelector("img")!;

    expect(img.getAttribute("src")).toBe("cdn:banner.png");
    expect(img.className).toContain("w-full");
    expect(img.className).toContain("object-contain");
    expect(img.className).toContain("max-h-");
    // `h-36`/`object-cover` cortavam o cartaz em qualquer largura. O `h-[...]` também conta.
    expect(img.className).not.toContain("object-cover");
    expect(img.className).not.toMatch(/(^|\s)h-(\d|\[)/);
  });

  it("descreve o cartaz quando quem usa informa o nome do mentor", () => {
    act(() => root!.render(<MentorBanner src="banner.png" alt="Erika Linares" />));

    expect(container.querySelector("img")!.getAttribute("alt")).toBe("Erika Linares");
  });

  it("aceita a classe extra de quem usa", () => {
    act(() => root!.render(<MentorBanner src="banner.png" className="max-h-40" />));

    expect(container.querySelector("img")!.className).toContain("max-h-40");
  });
});
