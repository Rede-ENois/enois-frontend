// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EnoisProvider } from "@rede-enois/design-system";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiUrl } from "@/lib/api-client";
import { isOwnMediaUrl } from "@/lib/api/media";

import { RichText } from "./rich-text";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Caminhos do proxy, iguais aos que `GET /emotes/index` devolve. */
const KEKW = "/emotes/image/BTTV/abc123?variant=full";
const CATJAM = "/emotes/image/FFZ/9?variant=full&a=1";

let indiceFora = false;

/**
 * O texto só conhece o índice do NOSSO backend; aqui um `fetch` falso devolve a mesma forma, então
 * o caminho testado é o de verdade (busca, índice, troca do código e desenho do RichText).
 */
function fakeFetch(input: RequestInfo | URL) {
  const url = new URL(String(input), "http://localhost");
  if (indiceFora || !url.pathname.endsWith("/emotes/index")) {
    return {
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers(),
      json: async () => ({ code: undefined, message: undefined }),
    };
  }
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({
      entries: { KEKW, catJAM: CATJAM },
      generatedAt: "2026-10-29T00:00:00Z",
    }),
  };
}

let root: Root | null = null;
let host: HTMLDivElement;

beforeEach(() => {
  indiceFora = false;
  // O índice é guardado no `localStorage`: sem limpar, uma cópia de outro teste vazaria para cá.
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

  // O índice chega por promise: sem esperar, o primeiro desenho ainda mostra o código cru.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  return host.innerHTML;
}

describe("RichText com figurinhas", () => {
  it("desenha a figurinha no meio da frase", async () => {
    const html = await render("oi KEKW tudo bem?");

    expect(html).toContain(`src="${apiUrl(KEKW)}"`);
    expect(html).toContain("<p");
    expect(html).not.toContain("KEKW tudo");
  });

  it("pede a imagem ao nosso proxy, não ao CDN do provedor", async () => {
    const html = await render("aí catJAM");
    // O atributo sai com `&amp;` no HTML, como qualquer `&` de URL.
    const src = /<img[^>]*src="([^"]+)"/.exec(html)?.[1]?.replace(/&amp;/g, "&");

    expect(src).toBe(apiUrl(CATJAM));
    expect(html).not.toContain("cdn.frankerfacez.com");
    expect(html).not.toContain("cdn.betterttv.net");
  });

  it("mantém a pontuação em volta da figurinha", async () => {
    const html = await render("(KEKW)");
    const imagem = html.match(/<img[^>]*>/)?.[0];

    expect(imagem).toBeTruthy();
    expect(html).toContain(`(${imagem})`);
  });

  it("não mexe em palavra que só parece o código", async () => {
    const html = await render("o kekw minúsculo e o KEKWzão continuam texto");

    expect(html).not.toContain("<img");
    expect(html).toContain("kekw");
  });

  it("com o índice fora do ar o texto sai com o código cru, sem erro", async () => {
    indiceFora = true;
    const html = await render("oi KEKW");

    expect(html).not.toContain("<img");
    expect(html).toContain("KEKW");
  });

  it("texto sem figurinha sai como sempre", async () => {
    const html = await render("só um **texto** normal");

    expect(html).not.toContain("<img");
    expect(html).toContain("<strong");
  });
});
