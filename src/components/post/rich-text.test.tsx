// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EnoisProvider } from "@rede-enois/design-system";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isOwnMediaUrl } from "@/lib/api/media";

import { RichText } from "./rich-text";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BTTV = "https://cdn.betterttv.net/emote/abc123/2x.png";
const FFZ = "https://cdn.frankerfacez.com/emoticon/9/2";

/**
 * O catálogo real responde as duas APIs; aqui um `fetch` falso devolve a mesma forma, então o
 * caminho testado é o de verdade (busca, índice, troca do código e desenho do RichText).
 */
function fakeFetch(input: RequestInfo | URL) {
  const url = String(input);
  if (url.includes("betterttv")) {
    return {
      ok: true,
      json: async () => [{ id: "abc123", code: "KEKW" }],
    };
  }
  return {
    ok: true,
    json: async () => ({
      default_sets: [3],
      sets: { "3": { emoticons: [{ name: "catJAM", urls: { "2": FFZ } }] } },
    }),
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

async function render(content: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  await act(async () => {
    root?.render(
      <QueryClientProvider client={client}>
        <EnoisProvider isOwnMediaUrl={isOwnMediaUrl}>
          <RichText content={content} />
        </EnoisProvider>
      </QueryClientProvider>,
    );
  });

  // O catálogo chega por promise: sem esperar, o primeiro desenho ainda mostra o código cru.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  return host.innerHTML;
}

describe("RichText com figurinhas globais", () => {
  it("desenha a figurinha do BTTV no meio da frase", async () => {
    const html = await render("oi KEKW tudo bem?");

    expect(html).toContain(`src="${BTTV}"`);
    expect(html).toContain("<p");
    expect(html).not.toContain("KEKW tudo");
  });

  it("desenha a figurinha do FFZ, que não termina em extensão de imagem", async () => {
    const html = await render("aí catJAM");

    expect(html).toContain(`src="${FFZ}"`);
  });

  it("mantém a pontuação em volta da figurinha", async () => {
    const html = await render("(KEKW)");

    expect(html).toContain(`(${html.match(/<img[^>]*>/)?.[0] ?? ""}`);
  });

  it("não mexe em palavra que só parece o código", async () => {
    const html = await render("o kekw minúsculo e o KEKWzão continuam texto");

    expect(html).not.toContain("cdn.betterttv.net");
    expect(html).toContain("kekw");
  });

  it("texto sem figurinha sai como sempre", async () => {
    const html = await render("só um **texto** normal");

    expect(html).not.toContain("<img");
    expect(html).toContain("<strong");
  });
});
