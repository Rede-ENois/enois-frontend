// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Route } from "@/routes/carteira";
import { texts } from "@/texts";
import type { LojaItem } from "@/types/application/loja/loja-item";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => ReactNode }) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => {},
  }),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
// A vitrine do marketplace tem a própria suíte; aqui só a Carteira importa.
vi.mock("@/components/marketplace/marketplace-section", () => ({
  MarketplaceSection: () => null,
}));
// Os eventos do Saci têm a própria cobertura (lib/cosmetics e lib/api/cosmetic-events).
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/events/saci-duel-panel", () => ({ SaciDuelPanel: () => null }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@rede-enois/design-system/ui")>()),
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: undefined }) }));
vi.mock("@/lib/api", () => ({
  walletApi: { wallet: vi.fn(), cotacao: vi.fn() },
  lojaApi: {
    catalog: vi.fn(),
    collections: vi.fn(),
    buy: vi.fn(),
    buyLook: vi.fn(),
    equip: vi.fn(),
    unequip: vi.fn(),
  },
  cosmeticEventsApi: { duel: vi.fn(), hunt: vi.fn(), choose: vi.fn(), find: vi.fn() },
}));

const catalog: LojaItem[] = [
  "ambar",
  "esmeralda",
  "violeta",
  "coral",
  "aurora",
  "pulsar",
  "solar",
  "tempestade",
  "inferno",
  "buraco-negro",
  "orbita",
  "glacial",
  "toxica",
  "nebulosa",
  "supernova",
  "portal",
  "holograma",
  "galaxia",
].map((name, index) => ({
  id: `moldura-${name}`,
  kind: "FRAME",
  collection: null,
  available: true,
  purchasable: true,
  name,
  description: "Moldura de demonstração",
  priceMf: 2000,
  cssRing: "",
  releaseOrder: index + 1,
  owned: index % 2 === 0,
  equipped: false,
}));
/** Owned, but not a frame: "Minhas molduras" must leave it out. */
const ownedBadge: LojaItem = {
  ...catalog[0],
  id: "emblema-carapuca",
  kind: "BADGE",
  collection: "saci",
  name: "Carapuça",
  releaseOrder: catalog.length + 1,
  owned: true,
};
const ownedCatalog = catalog.map((item): LojaItem => ({ ...item, owned: true }));

describe("Carteira e ordenação das molduras", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    client.setQueryData(["loja", "oldest"], [...catalog, ownedBadge]);
    client.setQueryData(
      ["loja", "newest"],
      [ownedBadge, ...[...catalog].sort((a, b) => b.releaseOrder - a.releaseOrder)],
    );
    client.setQueryData(["loja", "colecoes"], []);
    client.setQueryData(["carteira"], { balance: 0, chave: "demonstracao", entries: [] });
    client.setQueryData(["cotacao"], { brlCents: 100, brlMicros: 1_000_000, historico: [] });
    const Page = Route.options.component!;
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Page />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  async function openTab(value: string) {
    const tab = [...host.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(
      (element) => element.textContent === value,
    )!;
    await act(async () => {
      tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    });
  }

  async function changeOrder(value: string) {
    const select = host.querySelector<HTMLSelectElement>("select")!;
    await act(async () => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function names() {
    return [...host.querySelectorAll(".frame-shop-card h3")].map((element) => element.textContent);
  }

  async function click(text: string) {
    const button = [...host.querySelectorAll("button")].find(
      (element) => element.textContent === text,
    )!;
    await act(async () => button.click());
  }

  it("abre em Carteira e exibe ícones nas três abas", () => {
    const tabs = [...host.querySelectorAll("[role=tab]")];
    expect(tabs[0].textContent).toBe(texts.frameShop.walletTab);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[0].querySelector("svg.lucide-zap")).not.toBeNull();
    for (const tab of tabs) expect(tab.querySelector("svg[aria-hidden=true]")).not.toBeNull();
    expect(host.textContent).toContain(texts.wallet.history);
    expect(host.querySelector(".frame-shop-grid")).toBeNull();
  });

  it("abre a loja de cosméticos na aba Loja", async () => {
    await openTab(texts.frameShop.storeTab);
    expect(host.querySelector(".frame-shop-grid")).toBeNull();
    // Sem coleções, a loja abre nos clássicos (moldura sem coleção) com a prévia do perfil.
    expect(host.querySelector(".cos-card")).not.toBeNull();
    expect(host.textContent).toContain("galaxia");
  });

  /** Com todas as molduras compradas, "Minhas molduras" mostra o catálogo inteiro na ordem da API. */
  function ownAll() {
    client.setQueryData(["loja", "oldest"], ownedCatalog);
    client.setQueryData(
      ["loja", "newest"],
      [...ownedCatalog].sort((a, b) => b.releaseOrder - a.releaseOrder),
    );
  }

  it("exibe a ordem de cada resposta da API e pagina sem alterar o cache", async () => {
    ownAll();
    await openTab(texts.frameShop.ownedTab);
    expect(names()).toEqual(catalog.slice(0, 12).map((item) => item.name));
    expect(host.querySelector("select")!.value).toBe("oldest");
    await changeOrder("newest");
    expect(names()).toEqual(
      [...catalog]
        .sort((a, b) => b.releaseOrder - a.releaseOrder)
        .slice(0, 12)
        .map((item) => item.name),
    );
    await click(texts.frameShop.showMore);
    expect(names()).toEqual(
      [...catalog].sort((a, b) => b.releaseOrder - a.releaseOrder).map((item) => item.name),
    );
    await changeOrder("oldest");
    expect(names()).toEqual(catalog.slice(0, 12).map((item) => item.name));
    expect(client.getQueryData(["loja", "oldest"])).toEqual(ownedCatalog);
  });

  it("preserva a ordenação ao filtrar e ao voltar para Todas", async () => {
    ownAll();
    await openTab(texts.frameShop.ownedTab);
    await changeOrder("newest");
    await click(texts.frameShop.filters.simple);
    expect(names()).toEqual(["coral", "violeta", "esmeralda", "ambar"]);
    await click(texts.frameShop.filters.all);
    expect(names()[0]).toBe("galaxia");
    expect(names()).toHaveLength(12);
  });

  it("oferece as duas ordens também em Minhas molduras, sem incluir itens não comprados", async () => {
    await openTab(texts.frameShop.ownedTab);
    const owned = catalog.filter((item) => item.owned).map((item) => item.name);
    expect(names()).toEqual(owned);
    await changeOrder("newest");
    expect(names()).toEqual([...owned].reverse());
    await changeOrder("oldest");
    expect(names()).toEqual(owned);
  });
});
