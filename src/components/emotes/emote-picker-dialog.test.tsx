// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMOTES_POR_PAGINA } from "@/lib/emotes/pagination";

import { EmotePickerDialog } from "./emote-picker-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TOTAL = EMOTES_POR_PAGINA + 12;

/** Cinquenta e duas figurinhas estáticas do BTTV: o suficiente para duas páginas da grade. */
function fakeFetch(input: RequestInfo | URL) {
  if (String(input).includes("betterttv")) {
    return {
      ok: true,
      json: async () =>
        Array.from({ length: TOTAL }, (_, indice) => ({
          id: `id${indice}`,
          code: `EMOTE${String(indice).padStart(2, "0")}`,
        })),
    };
  }
  return { ok: true, json: async () => ({ default_sets: [], sets: {} }) };
}

let root: Root | null = null;
let host: HTMLDivElement;

function grade() {
  return [...document.querySelectorAll<HTMLButtonElement>('button[title^="EMOTE"]')];
}

function botao(rotulo: string) {
  return document.querySelector<HTMLButtonElement>(`button[aria-label="${rotulo}"]`);
}

async function renderizar() {
  await act(async () => {
    root?.render(
      <QueryClientProvider client={new QueryClient()}>
        <EmotePickerDialog open onOpenChange={() => {}} onSelect={() => {}} />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

async function digitar(termo: string) {
  const campo = document.querySelector<HTMLInputElement>(
    `input[placeholder="${texts.emotes.searchPlaceholder}"]`,
  );
  expect(campo).toBeTruthy();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  await act(async () => {
    setter?.call(campo, termo);
    campo?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  host.remove();
  root = null;
  vi.unstubAllGlobals();
});

describe("Seletor de figurinhas", () => {
  it("abre só com a primeira página e mostra quantas figurinhas existem", async () => {
    await renderizar();

    expect(grade()).toHaveLength(EMOTES_POR_PAGINA);
    expect(document.body.textContent).toContain(texts.emotes.page(1, 2));
    expect(document.body.textContent).toContain(texts.emotes.count(TOTAL));
  });

  it("a grade usa a miniatura 1x, não a imagem grande", async () => {
    await renderizar();

    const src = grade()[0]?.querySelector("img")?.getAttribute("src");

    expect(src).toBe("https://cdn.betterttv.net/emote/id0/1x.png");
  });

  it("navega entre as páginas e trava nos extremos", async () => {
    await renderizar();

    expect(botao(texts.emotes.previous)?.disabled).toBe(true);

    await act(async () => botao(texts.emotes.next)?.click());

    expect(grade()).toHaveLength(TOTAL - EMOTES_POR_PAGINA);
    expect(document.body.textContent).toContain(texts.emotes.page(2, 2));
    expect(botao(texts.emotes.next)?.disabled).toBe(true);

    await act(async () => botao(texts.emotes.previous)?.click());

    expect(grade()).toHaveLength(EMOTES_POR_PAGINA);
    expect(document.body.textContent).toContain(texts.emotes.page(1, 2));
  });

  it("a busca volta para a primeira página e reduz o resultado", async () => {
    await renderizar();

    await act(async () => botao(texts.emotes.next)?.click());
    await digitar("EMOTE51");

    expect(grade()).toHaveLength(1);
    expect(grade()[0]?.getAttribute("title")).toBe("EMOTE51");
    expect(document.body.textContent).not.toContain(texts.emotes.page(2, 2));
  });
});
