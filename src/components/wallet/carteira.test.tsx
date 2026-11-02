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
// A vitrine do marketplace tem a própria suíte; aqui só interessa que ela vive na aba Loja.
vi.mock("@/components/marketplace/marketplace-section", () => ({
  MarketplaceSection: () => <div data-testid="marketplace" />,
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
/** Owned, but not a frame: "Meus itens" lists it with the frames. */
const ownedBadge: LojaItem = {
  ...catalog[0],
  id: "emblema-carapuca",
  kind: "BADGE",
  collection: "saci",
  name: "Carapuça",
  releaseOrder: catalog.length + 1,
  owned: true,
};
describe("Carteira, loja e meus itens", () => {
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

  /** Os itens da aba "Meus itens", na ordem em que aparecem na tela. */
  function itemIds(): string[] {
    return [...host.querySelectorAll<HTMLElement>("[data-item-id]")].map(
      (element) => element.dataset.itemId!,
    );
  }

  /** Os títulos de seção da aba, na ordem em que aparecem. */
  function headings(): string[] {
    return [...host.querySelectorAll("h2, h3")].map((element) => element.textContent ?? "");
  }

  async function click(text: string) {
    const button = [...host.querySelectorAll("button")].find(
      (element) => element.textContent === text,
    )!;
    await act(async () => button.click());
  }

  it("abre em Carteira e exibe ícones nas três abas", () => {
    const tabs = [...host.querySelectorAll("[role=tab]")];
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      texts.frameShop.walletTab,
      texts.frameShop.storeTab,
      texts.frameShop.ownedTab,
    ]);
    expect(tabs[0].textContent).toBe(texts.frameShop.walletTab);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(tabs[0].querySelector("svg.lucide-zap")).not.toBeNull();
    for (const tab of tabs) expect(tab.querySelector("svg[aria-hidden=true]")).not.toBeNull();
    expect(host.textContent).toContain(texts.wallet.history);
  });

  it("mostra a sequência que vem com a carteira antes do histórico", async () => {
    await act(async () =>
      client.setQueryData(["carteira"], {
        balance: 0,
        chave: "demonstracao",
        entries: [],
        streak: {
          currentDays: 3,
          longestDays: 8,
          todayDone: false,
          freezesAvailable: 1,
          lastFrozenDay: null,
        },
      }),
    );
    // O react-query avisa os observadores no próximo tique.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const text = host.textContent ?? "";
    expect(text).toContain("Sua sequência");
    expect(text.indexOf("Sua sequência")).toBeLessThan(text.indexOf(texts.wallet.history));
  });

  it("sem a sequência na resposta, a carteira fica como era", () => {
    expect(host.textContent).not.toMatch(/sequência/i);
  });

  it("a aba Loja junta os cosméticos e o marketplace", async () => {
    await openTab(texts.frameShop.storeTab);
    expect(host.querySelector("[data-testid=marketplace]")).not.toBeNull();
    expect(host.querySelector(".cos-shop")).not.toBeNull();
  });

  it("o endereço antigo do marketplace cai na loja", () => {
    const validate = Route.options.validateSearch as unknown as (
      search: Record<string, unknown>,
    ) => Record<string, unknown>;
    expect(validate({ tab: "marketplace" })).toEqual({ tab: "loja" });
    expect(validate({ tab: "loja" })).toEqual({ tab: "loja" });
    expect(validate({ tab: "minhas" })).toEqual({ tab: "minhas" });
    expect(validate({ tab: "nao-existe" })).toEqual({});
  });

  it("abre a loja de cosméticos na aba Loja", async () => {
    await openTab(texts.frameShop.storeTab);
    // Sem coleções, a loja abre nos clássicos (moldura sem coleção) com a prévia do perfil.
    expect(host.querySelector(".cos-card")).not.toBeNull();
    expect(host.textContent).toContain("galaxia");
  });

  /** Troca o catálogo em cache e deixa o react-query avisar os observadores. */
  async function setCatalog(items: LojaItem[]) {
    await act(async () => {
      client.setQueryData(["loja", "oldest"], items);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it("a aba Meus itens lista tudo o que foi comprado, não só molduras", async () => {
    await openTab(texts.frameShop.ownedTab);
    const owned = [...catalog, ownedBadge].filter((item) => item.owned);
    expect(itemIds()).toEqual(owned.map((item) => item.id));
    // O emblema comprado aparece junto das molduras, na subcategoria dele.
    const sections = headings().join(" ");
    expect(sections).toContain(texts.frameShop.myItems.kinds.BADGE);
    expect(sections).toContain(texts.frameShop.myItems.kinds.FRAME);
  });

  it("deixa os ativos no topo, antes do resto", async () => {
    const equipped = { ...catalog[1], owned: true, equipped: true };
    await setCatalog([...catalog, ownedBadge, equipped]);
    await openTab(texts.frameShop.ownedTab);
    expect(itemIds()[0]).toBe(equipped.id);
    expect(headings()[0]).toBe(texts.frameShop.myItems.activeTitle);
    expect(headings().indexOf(texts.frameShop.myItems.activeTitle)).toBeLessThan(
      headings().indexOf(texts.frameShop.myItems.ownedTitle),
    );
    // O ativo não se repete na lista de baixo.
    expect(itemIds().filter((id) => id === equipped.id)).toHaveLength(1);
  });

  it("equipa e tira o item direto da lista", async () => {
    const { lojaApi, walletApi } = await import("@/lib/api");
    // A invalidação depois do equipar refaz as duas consultas: elas respondem, não `undefined`.
    vi.mocked(lojaApi.catalog).mockResolvedValue([...catalog, ownedBadge]);
    vi.mocked(walletApi.wallet).mockResolvedValue({
      balance: 0,
      escala: 1,
      cotacaoBrlCents: 100,
      cotacaoBrlMicros: 1_000_000,
      chave: "demonstracao",
      entries: [],
    });
    vi.mocked(lojaApi.equip).mockResolvedValue({ id: "moldura-ambar", equipped: true });
    vi.mocked(lojaApi.unequip).mockResolvedValue({ id: "moldura-ambar", equipped: false });
    await openTab(texts.frameShop.ownedTab);
    await click(texts.frameShop.myItems.equip);
    expect(lojaApi.equip).toHaveBeenCalledWith("moldura-ambar");
  });

  it("sem nada comprado, explica e leva para a loja", async () => {
    await setCatalog(catalog.map((item) => ({ ...item, owned: false })));
    await openTab(texts.frameShop.ownedTab);
    expect(host.textContent).toContain(texts.frameShop.myItems.empty);
    await click(texts.frameShop.myItems.emptyCta);
    expect(host.querySelector(".cos-shop")).not.toBeNull();
  });
});
