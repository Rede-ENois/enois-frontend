// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMOTES_POR_PAGINA } from "@/lib/emotes/use-emotes";

import { EmotePickerDialog } from "./emote-picker-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A grade chega em duas etapas (busca + promise) e a suíte roda com dezenas de workers: com o
// limite padrão de 5s, um worker sem CPU transforma espera legítima em teste vermelho.
vi.setConfig({ testTimeout: 20_000 });

const TOTAL = EMOTES_POR_PAGINA + 12;
const CODIGOS = Array.from(
  { length: TOTAL },
  (_, indice) => `EMOTE${String(indice).padStart(2, "0")}`,
);

/**
 * Backend de figurinhas de mentira: pagina e busca igual ao de verdade (`GET /emotes?page&limit&q`),
 * então o caminho testado é o real — a página chega pronta, o seletor só desenha.
 */
function fakeFetch(input: RequestInfo | URL) {
  const url = new URL(String(input), "http://localhost");
  if (url.pathname.endsWith("/emotes/index")) {
    return resposta({ entries: {}, generatedAt: "2026-10-29T00:00:00Z" });
  }

  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? EMOTES_POR_PAGINA);
  const termo = (url.searchParams.get("q") ?? "").toLowerCase();
  const filtrados = CODIGOS.filter((codigo) => codigo.toLowerCase().includes(termo));
  const inicio = (page - 1) * limit;

  return resposta({
    items: filtrados.slice(inicio, inicio + limit).map((code) => ({
      code,
      provider: "BTTV",
      id: code,
      animated: false,
      popularRank: null,
      image: `/emotes/image/BTTV/${code}?variant=full`,
      thumb: `/emotes/image/BTTV/${code}?variant=thumb`,
    })),
    page,
    limit,
    total: filtrados.length,
    totalPages: Math.max(1, Math.ceil(filtrados.length / limit)),
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

function grade() {
  return [...document.querySelectorAll<HTMLButtonElement>('button[title^="EMOTE"]')];
}

function titulos() {
  return grade().map((botao) => botao.title);
}

function botao(rotulo: string) {
  return document.querySelector<HTMLButtonElement>(`button[aria-label="${rotulo}"]`);
}

async function esperar(ms = 60) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/**
 * A página chega por promise (e a busca espera a pessoa parar de digitar): espera o estado virar,
 * em vez de dormir um tempo fixo — sob carga da suíte inteira, tempo fixo vira teste instável.
 */
async function esperarAte(criterio: () => boolean, limite = 12_000) {
  const fim = Date.now() + limite;
  while (!criterio() && Date.now() < fim) {
    await esperar(25);
  }
}

async function renderizar(open = true) {
  await act(async () => {
    root?.render(
      <QueryClientProvider client={new QueryClient()}>
        <EmotePickerDialog open={open} onOpenChange={() => {}} onSelect={() => {}} />
      </QueryClientProvider>,
    );
  });
  await esperar();
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
  // A busca espera a pessoa parar de digitar antes de ir ao backend.
  await esperar(300);
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
  vi.useRealTimers();
});

describe("Seletor de figurinhas", () => {
  it("abre só com a primeira página e mostra quantas figurinhas existem no total", async () => {
    await renderizar();
    await esperarAte(() => grade().length === EMOTES_POR_PAGINA);

    expect(grade()).toHaveLength(EMOTES_POR_PAGINA);
    expect(document.body.textContent).toContain(texts.emotes.page(1, 2));
    expect(document.body.textContent).toContain(texts.emotes.count(TOTAL));
  });

  it("a grade usa a miniatura do proxy, não a imagem grande", async () => {
    await renderizar();
    await esperarAte(() => grade().length === EMOTES_POR_PAGINA);

    const src = grade()[0]?.querySelector("img")?.getAttribute("src");

    expect(src).toContain("/api/emotes/image/BTTV/EMOTE00?variant=thumb");
  });

  it("lista única: não há filtro por provedor nem aba de populares", async () => {
    await renderizar();
    await esperarAte(() => grade().length === EMOTES_POR_PAGINA);

    const rotulos = [...document.querySelectorAll<HTMLButtonElement>("button")].map(
      (item) => item.textContent,
    );

    expect(rotulos).not.toContain("Todas");
    expect(rotulos).not.toContain("Populares");
    expect(rotulos).not.toContain("BTTV");
    expect(rotulos).not.toContain("FFZ");
  });

  it("navega entre as páginas e trava nos extremos", async () => {
    await renderizar();
    await esperarAte(() => grade().length === EMOTES_POR_PAGINA);

    expect(botao(texts.emotes.previous)?.disabled).toBe(true);

    await act(async () => botao(texts.emotes.next)?.click());
    await esperarAte(() => grade().length === TOTAL - EMOTES_POR_PAGINA);

    expect(grade()).toHaveLength(TOTAL - EMOTES_POR_PAGINA);
    expect(titulos()[0]).toBe("EMOTE40");
    expect(document.body.textContent).toContain(texts.emotes.page(2, 2));
    expect(botao(texts.emotes.next)?.disabled).toBe(true);

    await act(async () => botao(texts.emotes.previous)?.click());
    await esperarAte(
      () =>
        grade().length === EMOTES_POR_PAGINA &&
        Boolean(document.body.textContent?.includes(texts.emotes.page(1, 2))),
    );

    expect(grade()).toHaveLength(EMOTES_POR_PAGINA);
    expect(document.body.textContent).toContain(texts.emotes.page(1, 2));
  });

  it("trocar de página logo ao abrir não é desfeito pela espera da busca", async () => {
    // Relógio controlado: o clique cai dentro da espera da busca (250ms) em qualquer máquina. Com o
    // relógio real, este caso só aparecia sob carga, como falha intermitente do teste de navegação.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const avancar = (ms: number) => act(async () => vi.advanceTimersByTimeAsync(ms));

    await act(async () => {
      root?.render(
        <QueryClientProvider client={new QueryClient()}>
          <EmotePickerDialog open onOpenChange={() => {}} onSelect={() => {}} />
        </QueryClientProvider>,
      );
    });
    await avancar(50);
    expect(grade()).toHaveLength(EMOTES_POR_PAGINA);

    await act(async () => botao(texts.emotes.next)?.click());
    await avancar(50);
    expect(document.body.textContent).toContain(texts.emotes.page(2, 2));

    await avancar(1_000);
    expect(document.body.textContent).toContain(texts.emotes.page(2, 2));
    expect(grade()).toHaveLength(TOTAL - EMOTES_POR_PAGINA);
  });

  it("a busca vai ao backend, volta para a primeira página e reduz o resultado", async () => {
    await renderizar();
    await esperarAte(() => grade().length === EMOTES_POR_PAGINA);

    await act(async () => botao(texts.emotes.next)?.click());
    await esperarAte(() => grade().length === TOTAL - EMOTES_POR_PAGINA);

    await digitar("EMOTE51");
    await esperarAte(() => grade().length === 1);

    expect(grade()).toHaveLength(1);
    expect(grade()[0]?.getAttribute("title")).toBe("EMOTE51");
    expect(document.body.textContent).toContain(texts.emotes.count(1));
    expect(document.body.textContent).not.toContain(texts.emotes.page(2, 2));
  });

  it("busca sem resultado mostra o aviso, não uma grade vazia", async () => {
    await renderizar();
    await esperarAte(() => grade().length === EMOTES_POR_PAGINA);

    await digitar("naoexiste");
    await esperarAte(() => Boolean(document.body.textContent?.includes(texts.emotes.empty)));

    expect(grade()).toHaveLength(0);
    expect(document.body.textContent).toContain(texts.emotes.empty);
  });

  it("fechado não busca nada no backend", async () => {
    await renderizar(false);

    expect(grade()).toHaveLength(0);
    expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
  });
});
