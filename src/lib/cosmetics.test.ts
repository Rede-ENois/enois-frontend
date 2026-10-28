import { describe, expect, it } from "vitest";

import { ApiError } from "./api-client";
import {
  changesNameStyle,
  cosmeticErrorMessage,
  huntSpotVisible,
  lookPriceMf,
  statusIconChoices,
} from "./cosmetics";

describe("estilo de nome equipado pela loja", () => {
  const itemsById = new Map([
    ["nome-saci", { kind: "NAME_STYLE" as const }],
    ["moldura-carapuca", { kind: "FRAME" as const }],
  ]);

  it("avisa quando um item ou look troca o estilo de nome", () => {
    expect(changesNameStyle(["moldura-carapuca", "nome-saci"], itemsById)).toBe(true);
  });

  it("ignora itens de outros tipos e ids desconhecidos", () => {
    expect(changesNameStyle(["moldura-carapuca", "nome-futuro"], itemsById)).toBe(false);
  });
});

describe("preço do look", () => {
  const items = new Map([
    ["tema-saci", { priceMf: 5000, owned: false }],
    ["moldura-redemoinho", { priceMf: 3000, owned: true }],
    ["emblema-carapuca", { priceMf: 1000, owned: false }],
  ]);

  it("cobra 75% só das peças que faltam, em faíscas inteiras", () => {
    // (5000 + 1000) * 0,75 = 4500 mf = 4,5 faíscas → 5 faíscas.
    expect(
      lookPriceMf({ items: ["tema-saci", "moldura-redemoinho", "emblema-carapuca"] }, items),
    ).toBe(5000);
  });

  it("arredonda para baixo abaixo da metade", () => {
    // 1000 * 0,75 = 750 mf → 1 faísca; 2000 * 0,75 = 1500 mf → 2 faíscas; 3000 → 2250 → 2.
    expect(lookPriceMf({ items: ["emblema-carapuca"] }, items)).toBe(1000);
    expect(lookPriceMf({ items: ["x"] }, new Map([["x", { priceMf: 3000, owned: false }]]))).toBe(
      2000,
    );
  });

  it("é zero quando tudo já é seu ou a peça não está no catálogo", () => {
    expect(lookPriceMf({ items: ["moldura-redemoinho", "sumiu"] }, items)).toBe(0);
  });
});

describe("Saci escondido", () => {
  const hunt = { active: true, found: ["feed" as const] };

  it("aparece durante a caça no esconderijo ainda não achado", () => {
    expect(huntSpotVisible(hunt, "vagas", true)).toBe(true);
  });

  it("some no esconderijo achado, fora da caça, sem sessão ou sem resposta", () => {
    expect(huntSpotVisible(hunt, "feed", true)).toBe(false);
    expect(huntSpotVisible({ ...hunt, active: false }, "vagas", true)).toBe(false);
    expect(huntSpotVisible(hunt, "vagas", false)).toBe(false);
    expect(huntSpotVisible(undefined, "vagas", true)).toBe(false);
  });
});

describe("ícones do status", () => {
  it("lista os gratuitos e os dos emblemas oficiais que a pessoa tem, sem repetir", () => {
    const choices = statusIconChoices([
      { id: "emblema-carapuca", kind: "BADGE", name: "Carapuça", owned: true },
      { id: "emblema-abobora", kind: "BADGE", name: "Abóbora", owned: false },
      { id: "emblema-estrela", kind: "BADGE", name: "Estrela", owned: true },
      { id: "moldura-redemoinho", kind: "FRAME", name: "Redemoinho", owned: true },
    ]);
    expect(choices.map((choice) => choice.icon)).toEqual([
      "cafe",
      "estrela",
      "coracao",
      "chip",
      "carapuca",
    ]);
  });
});

describe("mensagem de erro dos cosméticos", () => {
  it("traduz o código conhecido e cai no genérico no resto", () => {
    expect(cosmeticErrorMessage(new ApiError(409, "OUT_OF_SEASON", "x"))).toMatch(/temporada/);
    expect(cosmeticErrorMessage(new ApiError(500, "BOOM", "x"))).toMatch(/Tente de novo/);
    expect(cosmeticErrorMessage(new Error("rede"))).toMatch(/Tente de novo/);
  });
});
