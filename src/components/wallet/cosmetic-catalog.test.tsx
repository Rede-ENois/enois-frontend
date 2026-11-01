// @vitest-environment jsdom
import { act } from "react";

import type { CosmeticShopCollection, CosmeticShopItem } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CosmeticCatalog } from "./cosmetic-catalog";

/** Um item de cada canto do catálogo: clássicos, sazonais e um de fora de temporada. */
const shopItems: CosmeticShopItem[] = [
  {
    id: "moldura-ambar",
    kind: "FRAME",
    collection: null,
    name: "Âmbar",
    description: "Clássica, o ano inteiro",
    priceLabel: "20",
    available: true,
    purchasable: true,
  },
  {
    id: "moldura-redemoinho",
    kind: "FRAME",
    collection: "saci",
    name: "Redemoinho",
    description: "Do Dia do Saci",
    priceLabel: "30",
    available: true,
    purchasable: true,
  },
  {
    id: "emblema-abobora",
    kind: "BADGE",
    collection: "halloween",
    name: "Abóbora",
    description: "Brasa do Halloween",
    priceLabel: "15",
    available: false,
    purchasable: true,
  },
  {
    id: "tema-noite",
    kind: "CARD_THEME",
    collection: "natal",
    name: "Noite de Natal",
    description: "Verde e dourado",
    priceLabel: "40",
    available: true,
    purchasable: true,
    owned: true,
  },
  {
    id: "jardim-cerrado",
    kind: "GARDEN",
    collection: null,
    name: "Cerrado",
    description: "Ipê do quintal",
    priceLabel: "10",
    available: true,
    purchasable: true,
  },
];

const shopCollections: CosmeticShopCollection[] = [
  { id: "saci", name: "Dia do Saci", available: true, looks: [] },
  { id: "halloween", name: "Halloween", available: false, looks: [] },
  { id: "natal", name: "Natal", available: true, looks: [] },
];

const user = { name: "Ana" };

describe("Catálogo da loja", () => {
  let root: Root;
  let host: HTMLDivElement;
  const actions = {
    onRetry: vi.fn(),
    onBuy: vi.fn(),
    onBuyLook: vi.fn(),
    onEquip: vi.fn(),
    onUnequip: vi.fn(),
  };

  function render(props: { items?: CosmeticShopItem[]; collections?: CosmeticShopCollection[] }) {
    const node = (
      <CosmeticCatalog
        items={props.items ?? shopItems}
        collections={props.collections ?? shopCollections}
        user={user}
        actionPending={false}
        {...actions}
      />
    );
    return act(async () => root.render(node));
  }

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await render({});
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const names = (): (string | null)[] =>
    [...host.querySelectorAll(".cos-item h3")].map((element) => element.textContent);

  const chips = (group: "Coleções" | "Tipo de item"): HTMLButtonElement[] => [
    ...host.querySelectorAll<HTMLButtonElement>(`[role=group][aria-label="${group}"] button`),
  ];

  const chip = (label: string): HTMLButtonElement =>
    chips("Coleções").find((element) => element.textContent?.startsWith(label))!;

  async function click(element: HTMLElement) {
    await act(async () => element.click());
  }

  async function search(text: string) {
    const input = host.querySelector<HTMLInputElement>("input[type=search]")!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      setter.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("abre em todas as coleções: nada do catálogo fica escondido atrás de uma temporada", () => {
    expect(names()).toEqual(["Âmbar", "Redemoinho", "Abóbora", "Noite de Natal", "Cerrado"]);
    expect(chip("Todas as coleções").getAttribute("aria-pressed")).toBe("true");
    expect(host.textContent).toContain("Todas as customizações");
    // As coleções continuam a um clique, com as da temporada primeiro.
    expect(chips("Coleções").map((element) => element.textContent)).toEqual([
      "Todas as coleções",
      "Dia do Saci",
      "Natal",
      "Clássicos",
      "Halloween",
    ]);
  });

  it("os contadores de tipo somam o catálogo inteiro", () => {
    const counts = Object.fromEntries(
      chips("Tipo de item").map((element) => [
        element.textContent!.replace(/\d+$/, ""),
        element.textContent!.match(/\d+$/)?.[0],
      ]),
    );
    expect(counts).toMatchObject({
      Tudo: "5",
      Molduras: "2",
      Emblemas: "1",
      Temas: "1",
      Jardins: "1",
      Banners: "0",
    });
  });

  it("filtra por coleção e volta para todas", async () => {
    await click(chip("Dia do Saci"));
    expect(names()).toEqual(["Redemoinho"]);
    expect(host.textContent).toContain("Álbum");

    await click(chip("Halloween"));
    expect(names()).toEqual(["Abóbora"]);

    await click(chip("Todas as coleções"));
    expect(names()).toHaveLength(shopItems.length);
    expect(host.querySelector(".cos-album")).toBeNull();
  });

  it("item fora de temporada aparece, mas não é vendido", () => {
    const card = [...host.querySelectorAll(".cos-item")].find(
      (element) => element.querySelector("h3")?.textContent === "Abóbora",
    )!;
    expect(card.textContent).toContain("Fora de temporada");
    expect(card.textContent).not.toContain("Comprar");
  });

  it("a busca varre todas as coleções", async () => {
    await search("abóbora");
    expect(names()).toEqual(["Abóbora"]);
    expect(host.textContent).toContain("1 resultado");
  });

  it("compra e equipa direto do cartão", async () => {
    const buy = [...host.querySelectorAll("button")].find(
      (element) => element.textContent === "Comprar",
    )!;
    await click(buy);
    expect(actions.onBuy).toHaveBeenCalledWith("moldura-ambar");
    expect(actions.onEquip).not.toHaveBeenCalled();

    const equip = [...host.querySelectorAll("button")].find(
      (element) => element.textContent === "Equipar",
    )!;
    await click(equip);
    expect(actions.onEquip).toHaveBeenCalledWith("tema-noite");
  });

  it("sem coleções cadastradas, a loja continua mostrando tudo", async () => {
    await render({ collections: [] });
    expect(names()).toEqual(["Âmbar", "Redemoinho", "Abóbora", "Noite de Natal", "Cerrado"]);
    expect(chips("Coleções").map((element) => element.textContent)).toEqual([
      "Todas as coleções",
      "Clássicos",
    ]);
  });
});
