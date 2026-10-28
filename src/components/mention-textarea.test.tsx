// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentionTextarea } from "./mention-textarea";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A grade do seletor mostra a miniatura 1x da figurinha estática. */
const BTTV = "https://cdn.betterttv.net/emote/abc123/1x.png";

/** Mesmo formato das duas APIs reais: o catálogo global chega pelo `fetch` do navegador. */
function fakeFetch(input: RequestInfo | URL) {
  if (String(input).includes("betterttv")) {
    return { ok: true, json: async () => [{ id: "abc123", code: "KEKW" }] };
  }
  return { ok: true, json: async () => ({ default_sets: [], sets: {} }) };
}

let root: Root | null = null;
let host: HTMLDivElement;

beforeEach(() => {
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

function botao(texto: string) {
  return [...document.querySelectorAll("button")].find((node) => node.textContent?.includes(texto));
}

async function esperar() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe("Seletor de figurinhas do campo de escrita", () => {
  it("insere o código da figurinha escolhida no texto", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={new QueryClient()}>
          <MentionTextarea value="" onChange={onChange} toolbar />
        </QueryClientProvider>,
      );
    });

    const abrir = botao(texts.emotes.button);
    expect(abrir).toBeTruthy();

    await act(async () => abrir?.click());
    await esperar();

    const figurinha = document.querySelector<HTMLButtonElement>(`button[title="KEKW"]`);
    expect(figurinha?.querySelector("img")?.getAttribute("src")).toBe(BTTV);

    await act(async () => figurinha?.click());

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("KEKW");
  });

  it("separa a figurinha do texto vizinho com espaço", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root?.render(
        <QueryClientProvider client={new QueryClient()}>
          <MentionTextarea value="oi" onChange={onChange} toolbar />
        </QueryClientProvider>,
      );
    });

    // O cursor fica onde a pessoa digitou: o campo guarda a seleção mesmo depois do clique que
    // abre o seletor (o jsdom começa na posição 0, então a posição é colocada aqui).
    const campo = host.querySelector("textarea");
    expect(campo).toBeTruthy();
    act(() => campo?.setSelectionRange(2, 2));

    await act(async () => botao(texts.emotes.button)?.click());
    await esperar();
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`button[title="KEKW"]`)?.click(),
    );

    expect(onChange.mock.calls.at(-1)?.[0]).toBe("oi KEKW");
  });
});
