// @vitest-environment jsdom
import { act } from "react";
import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { MarketplaceListing } from "@/types/application/marketplace/marketplace-listing";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketplaceSection } from "./marketplace-section";

/**
 * Antes de gastar faísca dá para ler o que se leva: a descrição aparece no card (resumida) e
 * inteira em "Ver detalhes", junto de quem vende (com link para o perfil), do preço e do
 * "Comprar". O conteúdo em si continua saindo só depois da compra.
 */
const mocks = vi.hoisted(() => ({ catalog: vi.fn(), buy: vi.fn() }));

vi.mock("@/lib/api", () => ({
  marketplaceApi: {
    catalog: mocks.catalog,
    buy: mocks.buy,
    purchases: vi.fn().mockResolvedValue([]),
    sales: vi.fn().mockResolvedValue([]),
  },
  themesApi: { get: vi.fn() },
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => false }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    to: string;
    params: { username: string };
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to.replace("$username", params.username)} className={className}>
      {children}
    </a>
  ),
}));

const DESCRICAO =
  "Mentoria de 1 hora sobre portfólio.\nInclui revisão do LinkedIn e um roteiro de estudos.";

function listagem(overrides: Partial<MarketplaceListing> = {}): MarketplaceListing {
  return {
    id: "mkt_1",
    sellerId: "user_1",
    sellerName: "Vendedora",
    sellerUsername: "vendedora",
    itemKind: "SERVICE",
    itemId: "mitem_1",
    title: "Mentoria de portfólio",
    description: DESCRICAO,
    price: 120_000,
    status: "ACTIVE",
    createdAt: "2026-10-22T12:00:00Z",
    ...overrides,
  } as MarketplaceListing;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

const botao = (nome: string) =>
  [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === nome);

const dialogo = () => document.querySelector<HTMLElement>("[role='dialog']");

describe("detalhes da listagem no marketplace", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    mocks.catalog.mockReset().mockResolvedValue([listagem()]);
    mocks.buy.mockReset().mockResolvedValue({ purchaseId: "pur_1" });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const montar = async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <MarketplaceSection />
        </QueryClientProvider>,
      );
    });
    await flush();
  };

  it("mostra a descrição resumida no card", async () => {
    await montar();
    const resumo = [...host.querySelectorAll("p")].find((p) => p.textContent === DESCRICAO);
    expect(resumo?.className).toContain("line-clamp-3");
  });

  it("abre os detalhes com a descrição inteira, quem vende e o preço", async () => {
    await montar();
    act(() => botao("Ver detalhes")[0].click());

    const janela = dialogo();
    expect(janela).not.toBeNull();
    expect(janela!.textContent).toContain(DESCRICAO);
    expect(janela!.querySelector("a")?.getAttribute("href")).toBe("/perfil/vendedora");
    expect(janela!.textContent).toContain("faíscas");
  });

  it("o título também abre os detalhes", async () => {
    await montar();
    act(() => botao("Mentoria de portfólio")[0].click());
    expect(dialogo()).not.toBeNull();
  });

  it("avisa quando quem vende não escreveu descrição", async () => {
    mocks.catalog.mockResolvedValue([listagem({ description: "  " })]);
    await montar();
    act(() => botao("Ver detalhes")[0].click());
    expect(dialogo()!.textContent).toContain("não escreveu uma descrição");
  });

  it("compra de dentro dos detalhes e fecha a janela", async () => {
    await montar();
    act(() => botao("Ver detalhes")[0].click());

    const comprar = [...dialogo()!.querySelectorAll("button")].find(
      (b) => b.textContent === "Comprar",
    );
    act(() => comprar!.click());
    await flush();

    expect(mocks.buy).toHaveBeenCalledWith("mkt_1");
    expect(document.body.textContent).toContain("Compra confirmada");
    expect(document.body.textContent).not.toContain("Vendido por");
  });

  it("mostra o erro quando a compra falha, em vez de não fazer nada", async () => {
    mocks.buy.mockRejectedValue(new Error("saldo"));
    await montar();
    act(() => botao("Ver detalhes")[0].click());

    const comprar = [...dialogo()!.querySelectorAll("button")].find(
      (b) => b.textContent === "Comprar",
    );
    act(() => comprar!.click());
    await flush();

    expect(dialogo()!.querySelector("[role='alert']")?.textContent).toContain(
      "Não foi possível comprar",
    );
  });
});
