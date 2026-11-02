// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ProjectCover } from "./project-cover";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(src: string | null) {
  act(() => root.render(<ProjectCover src={src} className="h-36 w-full" />));
}

describe("ProjectCover", () => {
  it("mostra a imagem quando há URL", () => {
    render("https://x.test/a.png");

    expect(host.querySelector("img")?.getAttribute("src")).toBe("https://x.test/a.png");
  });

  it("troca pelo degradê quando a imagem não carrega", () => {
    render("https://x.test/pagina");

    act(() => {
      host.querySelector("img")?.dispatchEvent(new Event("error"));
    });

    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector("div")?.className).toContain("h-36");
  });

  it("tenta de novo quando a URL muda", () => {
    render("https://x.test/ruim");
    act(() => {
      host.querySelector("img")?.dispatchEvent(new Event("error"));
    });

    render("https://x.test/boa.png");

    expect(host.querySelector("img")?.getAttribute("src")).toBe("https://x.test/boa.png");
  });

  it("usa o degradê sem URL", () => {
    render(null);

    expect(host.querySelector("img")).toBeNull();
  });
});
