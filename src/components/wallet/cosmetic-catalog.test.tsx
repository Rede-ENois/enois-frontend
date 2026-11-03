// @vitest-environment jsdom
import { act } from "react";

import type { LookNaLoja } from "@/types/components/wallet/look-na-loja";
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

/** Um look com peça à venda, peça já comprada e peça fora da loja hoje. */
const lookCollections: CosmeticShopCollection[] = [
  {
    id: "saci",
    name: "Dia do Saci",
    available: true,
    looks: [
      {
        id: "look-saci",
        title: "Saci-pererê",
        items: ["tema-noite", "moldura-redemoinho", "emblema-abobora"],
        priceLabel: "30",
      },
    ],
  },
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
    onEquipLook: vi.fn(),
    onUnequipLook: vi.fn(),
  };

  function render(props: {
    items?: CosmeticShopItem[];
    collections?: CosmeticShopCollection[];
    lookPending?: string | null;
  }) {
    const node = (
      <CosmeticCatalog
        items={props.items ?? shopItems}
        collections={props.collections ?? shopCollections}
        user={user}
        actionPending={false}
        {...actions}
        {...(props.lookPending === undefined ? {} : { lookPending: props.lookPending })}
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

  it("abre em todas as coleções da temporada: o catálogo inteiro, sem as de fora", () => {
    // O Halloween está fora da janela: nem o item nem a aba dele aparecem.
    expect(names()).toEqual(["Âmbar", "Redemoinho", "Noite de Natal", "Cerrado"]);
    expect(chip("Todas as coleções").getAttribute("aria-pressed")).toBe("true");
    expect(host.textContent).toContain("Todas as customizações");
    expect(chips("Coleções").map((element) => element.textContent)).toEqual([
      "Todas as coleções",
      "Dia do Saci",
      "Natal",
      "Clássicos",
    ]);
  });

  it("os contadores de tipo somam só o que está na loja", () => {
    const counts = Object.fromEntries(
      chips("Tipo de item").map((element) => [
        element.textContent!.replace(/\d+$/, ""),
        element.textContent!.match(/\d+$/)?.[0],
      ]),
    );
    // Os contadores somam o que está na loja: a abóbora, fora da temporada, não entra.
    expect(counts).toMatchObject({
      Tudo: "4",
      Molduras: "2",
      Emblemas: "0",
      Temas: "1",
      Jardins: "1",
      Banners: "0",
    });
  });

  it("filtra por coleção e volta para todas", async () => {
    await click(chip("Dia do Saci"));
    expect(names()).toEqual(["Redemoinho"]);
    expect(host.textContent).toContain("Álbum");

    // A coleção fora de temporada não tem aba para clicar.
    expect(chips("Coleções").map((element) => element.textContent)).not.toContain("Halloween");

    await click(chip("Todas as coleções"));
    expect(names()).toHaveLength(4);
    expect(host.querySelector(".cos-album")).toBeNull();
  });

  it("a busca varre as coleções da temporada e não acha o que não está à venda", async () => {
    await search("abóbora");
    expect(names()).toEqual([]);
    expect(host.textContent).toContain("0 resultados");

    await search("redemoinho");
    expect(names()).toEqual(["Redemoinho"]);
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

  it("a peça que já é sua continua na loja depois da temporada, pronta para equipar", async () => {
    // O abóbora é do Halloween, fora da janela: só fica porque a pessoa já o comprou.
    await render({
      items: shopItems.map((item) =>
        item.id === "emblema-abobora" ? { ...item, owned: true } : item,
      ),
    });
    const card = [...host.querySelectorAll(".cos-item")].find(
      (element) => element.querySelector("h3")?.textContent === "Abóbora",
    )!;
    // É sua: a etiqueta diz isso, e a ação é equipar, não comprar.
    expect(card.textContent).toContain("Seu");
    expect(card.textContent).not.toContain("Comprar");
    const equip = [...card.querySelectorAll("button")].find(
      (element) => element.textContent === "Equipar",
    )!;
    await click(equip);
    expect(actions.onEquip).toHaveBeenCalledWith("emblema-abobora");
    // A coleção dele continua sem aba: não dá para comprar o que não está na temporada.
    expect(chips("Coleções").map((element) => element.textContent)).not.toContain("Halloween");
  });

  it("separa as peças do look por tipo, com compra e equipar individuais", async () => {
    await render({ collections: lookCollections });
    const look = host.querySelector(".cos-look")!;
    expect(look.querySelector("summary")!.textContent).toBe("2 peças");

    const groups = [...look.querySelectorAll("details section")].map(
      (section) => section.querySelector("h4")!.textContent,
    );
    expect(groups).toEqual(["Temas", "Molduras"]);

    const row = (name: string) =>
      [...look.querySelectorAll("details li")].find((element) =>
        element.textContent?.includes(name),
      )!;

    // Já comprada: a peça se equipa sozinha, sem comprar o look inteiro.
    expect(row("Noite de Natal").textContent).toContain("Equipar");

    // À venda: o preço da peça aparece no botão e a compra é só dela.
    const frame = row("Redemoinho");
    const buyPiece = [...frame.querySelectorAll("button")].at(-1)!;
    expect(buyPiece.getAttribute("aria-label")).toBe("Comprar Redemoinho por 30");
    expect(buyPiece.textContent).toContain("30");
    await click(buyPiece);
    expect(actions.onBuy).toHaveBeenCalledWith("moldura-redemoinho");
    expect(actions.onBuyLook).not.toHaveBeenCalled();

    // Fora de temporada: a peça não aparece no look.
    expect(look.textContent).not.toContain("Abóbora");
  });

  it("o look que já é meu veste no primeiro clique e sai no segundo", async () => {
    const mine = (equipped: boolean): CosmeticShopCollection[] => [
      {
        id: "saci",
        name: "Dia do Saci",
        available: true,
        looks: [
          {
            id: "look-saci",
            title: "Saci-pererê",
            items: ["tema-noite", "moldura-redemoinho", "emblema-abobora"],
            priceLabel: "30",
            owned: true,
            equipped,
          },
        ] as LookNaLoja[],
      },
    ];

    // Fora do perfil: o card veste, sem comprar nada.
    await render({ collections: mine(false) });
    const stage = host.querySelector<HTMLButtonElement>(".cos-look__stage")!;
    expect(stage.getAttribute("aria-pressed")).toBe("false");
    expect(stage.getAttribute("aria-label")).toBe("Vestir o meu look Saci-pererê");
    await click(stage);
    expect(actions.onEquipLook).toHaveBeenCalledWith("look-saci");
    expect(actions.onBuyLook).not.toHaveBeenCalled();
    expect(actions.onUnequipLook).not.toHaveBeenCalled();

    // No perfil: o mesmo clique tira.
    await render({ collections: mine(true) });
    const worn = host.querySelector<HTMLButtonElement>(".cos-look__stage")!;
    expect(worn.getAttribute("aria-pressed")).toBe("true");
    expect(worn.getAttribute("aria-label")).toBe("Tirar o look Saci-pererê do meu perfil");
    expect(host.querySelector(".cos-look")!.textContent).toContain("Vestindo");
    await click(worn);
    expect(actions.onUnequipLook).toHaveBeenCalledWith("look-saci");
    expect(actions.onEquipLook).toHaveBeenCalledTimes(1);
  });

  it("enquanto o look veste, o card segura o segundo clique", async () => {
    await render({
      collections: [
        {
          id: "saci",
          name: "Dia do Saci",
          available: true,
          looks: [
            {
              id: "look-saci",
              title: "Saci-pererê",
              items: ["tema-noite", "moldura-redemoinho", "emblema-abobora"],
              priceLabel: "30",
              owned: true,
              equipped: false,
            },
          ] as LookNaLoja[],
        },
      ],
      lookPending: "look-saci",
    });
    const stage = host.querySelector<HTMLButtonElement>(".cos-look__stage")!;
    expect(stage.disabled).toBe(true);
    await click(stage);
    expect(actions.onEquipLook).not.toHaveBeenCalled();
  });

  it("o look com peça faltando continua só provando, sem comprar pelo clique", async () => {
    await render({ collections: lookCollections });
    const stage = host.querySelector<HTMLButtonElement>(".cos-look__stage")!;
    expect(stage.getAttribute("aria-label")).toBe("Vestir o look Saci-pererê");
    await click(stage);
    expect(actions.onEquipLook).not.toHaveBeenCalled();
    expect(actions.onUnequipLook).not.toHaveBeenCalled();
    expect(actions.onBuyLook).not.toHaveBeenCalled();
  });

  it("sem coleções cadastradas, a loja continua mostrando tudo o que está à venda", async () => {
    await render({ collections: [] });
    expect(names()).toEqual(["Âmbar", "Redemoinho", "Noite de Natal", "Cerrado"]);
    expect(chips("Coleções").map((element) => element.textContent)).toEqual([
      "Todas as coleções",
      "Clássicos",
    ]);
  });
});
