// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUserId } from "@/lib/current-user";
import { figurinhasApi } from "@/lib/figurinhas/api";

import { abrirSeletor, botaoDoSeletor } from "./abrir-seletor.test-helper";
import { EmotePickerDialog } from "./emote-picker-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.setConfig({ testTimeout: 20_000 });

// O envio é outro caminho (arquivo, bytes, publicação) e tem os testes dele; aqui o que importa é
// que o seletor leve até ele e receba de volta a figurinha publicada.
vi.mock("@/components/figurinhas/envio-de-figurinha", () => ({
  EnvioDeFigurinha: ({ aoPublicar }: { aoPublicar?: (f: FigurinhaComunidade) => void }) => (
    <div>
      <p>FORMULARIO DE ENVIO</p>

      <button type="button" onClick={() => aoPublicar?.(figurinhaPublicada)}>
        PUBLICAR DE MENTIRA
      </button>
    </div>
  ),
}));

vi.mock("@/lib/current-user", () => ({ getCurrentUserId: vi.fn(() => "u1") }));

const figurinhaPublicada: FigurinhaComunidade = {
  id: "6",
  codigo: ":nova:",
  origem: "COMUNIDADE",
  nome: "Nova",
  autorId: "u1",
  imagem: "https://cdn.example/figurinhas/nova.webp",
  largura: 128,
  altura: 128,
  ativo: true,
  criadoEm: "2026-11-26T00:00:00Z",
  desativadoEm: null,
};

const COMUNIDADE: FigurinhaComunidade[] = ["rei", "chora"].map((codigo, indice) => ({
  ...figurinhaPublicada,
  id: `id-${codigo}`,
  codigo: `:${codigo}:`,
  nome: codigo,
  imagem: `https://cdn.example/figurinhas/${codigo}.webp`,
  largura: 100 + indice,
}));

vi.mock("@/lib/figurinhas/api", () => ({
  figurinhasApi: {
    pagina: vi.fn(),
    envioPermitido: vi.fn(async () => ({ pode: true })),
  },
}));

function semRede(input: RequestInfo | URL) {
  const url = new URL(String(input), "http://localhost");
  if (url.pathname.endsWith("/emotes/index")) {
    return resposta({ entries: {}, generatedAt: "2026-10-29T00:00:00Z" });
  }
  if (url.pathname === "/emotes" || url.pathname.endsWith("/emotes")) {
    return resposta({ items: [], page: 1, limit: 40, total: 0, totalPages: 1 });
  }
  return resposta({});
}

function resposta(body: unknown) {
  const texto = JSON.stringify(body);
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => texto,
    json: async () => body,
  };
}

let root: Root | null = null;
let host: HTMLDivElement;

async function esperar(ms = 60) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

async function esperarAte(criterio: () => boolean, limite = 12_000) {
  const fim = Date.now() + limite;
  while (!criterio() && Date.now() < fim) {
    await esperar(25);
  }
}

function aba(rotulo: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('button[role="tab"]')].find(
    (item) => item.textContent === rotulo,
  );
}

function botaoComTexto(rotulo: string) {
  return [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => item.textContent?.trim() === rotulo,
  );
}

/** As células da grade (o botão que abre o seletor tem `title` igual, e fica fora). */
function celulas() {
  return [...document.querySelectorAll<HTMLButtonElement>("button[title]")]
    .map((item) => item.title)
    .filter((titulo) => titulo !== texts.emotes.button);
}

async function trocarAba(rotulo: string) {
  const alvo = aba(rotulo);
  expect(alvo, `aba ${rotulo}`).toBeTruthy();
  await act(async () => {
    alvo?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    alvo?.click();
  });
}

async function renderizar(onSelect: (code: string) => void = () => {}) {
  await act(async () => {
    root?.render(
      <QueryClientProvider client={new QueryClient()}>
        <EmotePickerDialog onSelect={onSelect} />
      </QueryClientProvider>,
    );
  });
  // O Radix desmonta o diálogo no fechamento: o botão do seletor só volta depois disso.
  await esperarAte(() => Boolean(botaoDoSeletor(document)));
  await act(async () => abrirSeletor(document));
  await esperarAte(() => aba(texts.emotes.tabCommunity) !== undefined);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(semRede));
  vi.mocked(getCurrentUserId).mockReturnValue("u1");
  vi.mocked(figurinhasApi.pagina).mockResolvedValue({
    items: COMUNIDADE,
    autores: {},
    page: 1,
    limit: 48,
    total: 2,
    totalPages: 1,
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  host.remove();
  root = null;
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Seletor de figurinhas: comunidade e envio", () => {
  it("a aba Da comunidade lista o catálogo da rede e o clique devolve o código sem os dois-pontos", async () => {
    const onSelect = vi.fn();
    await renderizar(onSelect);
    await trocarAba(texts.emotes.tabCommunity);
    await esperarAte(() => celulas().includes("rei"));

    expect(figurinhasApi.pagina).toHaveBeenCalledWith(1, expect.any(Number), undefined);
    expect(celulas()).toEqual(["rei", "chora"]);
    expect(document.body.textContent).toContain(texts.emotes.count(2));

    await act(async () => {
      document.querySelector<HTMLButtonElement>('button[title="rei"]')?.click();
    });
    expect(onSelect).toHaveBeenCalledWith("rei");
    // Escolher fecha o seletor: o código já entrou no texto. A animação de saída do Radix roda fora
    // do `act`, então o fechamento aparece nas esperas seguintes, não num render.
    await esperar();
    await esperarAte(() => aba(texts.emotes.tabCommunity) === undefined, 4_000);
  });

  it("a busca da comunidade vai ao backend com o termo e mostra o aviso quando não há nada", async () => {
    vi.mocked(figurinhasApi.pagina).mockImplementation(async (_page, _limit, termo) => ({
      items: termo ? [] : COMUNIDADE,
      autores: {},
      page: 1,
      limit: 48,
      total: termo ? 0 : 2,
      totalPages: 1,
    }));
    await renderizar();
    await trocarAba(texts.emotes.tabCommunity);
    await esperarAte(() => celulas().includes("rei"));

    const campo = document.querySelector<HTMLInputElement>(
      `input[placeholder="${texts.emotes.searchPlaceholder}"]`,
    );
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setter?.call(campo, "naoexiste");
      campo?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await esperarAte(() =>
      vi.mocked(figurinhasApi.pagina).mock.calls.some(([, , termo]) => termo === "naoexiste"),
    );
    await esperarAte(() => Boolean(document.body.textContent?.includes(texts.emotes.empty)));

    expect(figurinhasApi.pagina).toHaveBeenLastCalledWith(1, expect.any(Number), "naoexiste");
    expect(celulas()).toEqual([]);
  });

  it("enviar abre o formulário e, ao fechar, volta para a comunidade com a nova na frente", async () => {
    await renderizar();
    await trocarAba(texts.emotes.tabCommunity);
    await esperarAte(() => celulas().includes("rei"));

    await act(async () => botaoComTexto(texts.emotes.botaoEnviar)?.click());
    await esperarAte(() => Boolean(document.body.textContent?.includes("FORMULARIO DE ENVIO")));
    // O formulário vem por cima, com o título dele: a lista continua atrás, coberta.
    expect(
      [...document.querySelectorAll("[role=dialog]")].some((dialogo) =>
        dialogo.textContent?.includes(texts.figurinhas.envio.titulo),
      ),
    ).toBe(true);

    await act(async () => botaoComTexto("PUBLICAR DE MENTIRA")?.click());
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await esperar();
    await esperarAte(() => aba(texts.emotes.tabCommunity) !== undefined);
    await esperarAte(() => celulas().includes("nova"));

    // Volta na comunidade, com a figurinha recém-publicada na frente da página do backend.
    expect(celulas()).toEqual(["nova", "rei", "chora"]);
    expect(aba(texts.emotes.tabCommunity)?.getAttribute("aria-selected")).toBe("true");
  });

  it("quem não entrou vê o envio do mesmo jeito: o formulário é que pede o login", async () => {
    vi.mocked(getCurrentUserId).mockReturnValue(null);
    await renderizar();

    expect(botaoComTexto(texts.emotes.botaoEnviar)).toBeTruthy();
  });

  it("o formulário leva ao catálogo completo, que agora tem entrada no menu", async () => {
    const { navigationItemsFor } = await import("@/components/navigation-items");
    const { contextOfPath } = await import("@/lib/interface-context");

    const entrada = navigationItemsFor("SOCIAL").find((item) => item.to === "/figurinhas");

    expect(entrada?.label).toBe(texts.navigation.items.stickers);
    expect(contextOfPath("/figurinhas")).toBe("SOCIAL");
  });
});
