// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentionTextarea } from "./mention-textarea";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A grade do seletor mostra a miniatura do proxy do backend. */
const MINIATURA = "/api/emotes/image/BTTV/abc123?variant=thumb";

/** Mesmo formato do backend: a página do catálogo já vem pronta e a imagem sai do proxy. */
function fakeFetch(input: RequestInfo | URL) {
  const url = new URL(String(input), "http://localhost");
  if (url.pathname.endsWith("/emotes/index")) {
    return resposta({
      entries: { KEKW: "/emotes/image/BTTV/abc123?variant=full" },
      generatedAt: "2026-10-29T00:00:00Z",
    });
  }
  return resposta({
    items: [
      {
        code: "KEKW",
        provider: "BTTV",
        id: "abc123",
        animated: false,
        popularRank: null,
        image: "/emotes/image/BTTV/abc123?variant=full",
        thumb: "/emotes/image/BTTV/abc123?variant=thumb",
      },
    ],
    page: 1,
    limit: 40,
    total: 1,
    totalPages: 1,
    generatedAt: "2026-10-29T00:00:00Z",
  });
}

/** Resposta 200 mínima que o cliente da API entende (ele lê cabeçalhos e corpo). */
function resposta(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
  };
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

/** A figurinha chega por promise: espera a grade desenhar em vez de dormir um tempo fixo. */
async function esperarFigurinha() {
  const limite = Date.now() + 3000;
  while (!document.querySelector('button[title="KEKW"]') && Date.now() < limite) {
    await esperar();
  }
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
    await esperarFigurinha();

    const figurinha = document.querySelector<HTMLButtonElement>(`button[title="KEKW"]`);
    expect(figurinha?.querySelector("img")?.getAttribute("src")).toBe(MINIATURA);

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
    await esperarFigurinha();
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`button[title="KEKW"]`)?.click(),
    );

    expect(onChange.mock.calls.at(-1)?.[0]).toBe("oi KEKW");
  });
});
