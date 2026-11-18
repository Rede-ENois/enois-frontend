import { REACTION_TYPES } from "@/types/application/reaction/reaction-type";
import { describe, expect, it } from "vitest";

import { ENOIS_CUSTOM_EMOJIS } from "@/lib/emotes/enois-pack";

import { REACTION_EMOJIS, REACTION_EMOJI_ASSETS } from "./reaction-emojis";

describe("REACTION_EMOJI_ASSETS", () => {
  it("cobre todas as reações oficiais com figurinha única e sem repetições", () => {
    const assets = Object.values(REACTION_EMOJI_ASSETS);

    expect(Object.keys(REACTION_EMOJI_ASSETS)).toEqual([...REACTION_TYPES]);
    expect(new Set(assets).size).toBe(assets.length);
  });

  it("é a reação de cada uma das 76 expressões do pacote, na mesma ordem", () => {
    // Reação e figurinha são a mesma lista: trocar a ordem de um lado sem o outro faria a pílula
    // de uma reação mostrar o ícone de outra.
    expect(REACTION_TYPES).toHaveLength(76);
    expect(ENOIS_CUSTOM_EMOJIS).toHaveLength(76);
    expect(Object.values(REACTION_EMOJI_ASSETS)).toEqual(
      ENOIS_CUSTOM_EMOJIS.map((item) => item.src),
    );
  });

  it("cada reação aponta para um ícone do pacote É Nóis", () => {
    const srcs = new Set(ENOIS_CUSTOM_EMOJIS.map((item) => item.src));

    for (const asset of Object.values(REACTION_EMOJI_ASSETS)) {
      expect(srcs.has(asset)).toBe(true);
      expect(asset.startsWith("/emojis/enois/")).toBe(true);
    }
  });
});

describe("REACTION_EMOJIS", () => {
  it("mantém o emoji das 26 reações antigas, sem repetição", () => {
    const antigas = REACTION_TYPES.slice(0, 26);

    expect(Object.keys(REACTION_EMOJIS).slice(0, 26)).toEqual([...antigas]);
    expect(new Set(Object.values(REACTION_EMOJIS).slice(0, 26)).size).toBe(26);
  });

  it("a reação nova mostra o emoji do mesmo ícone do pacote", () => {
    const porSrc = new Map(ENOIS_CUSTOM_EMOJIS.map((item) => [item.src, item]));

    for (const type of REACTION_TYPES.slice(26)) {
      expect(REACTION_EMOJIS[type], type).toBe(porSrc.get(REACTION_EMOJI_ASSETS[type])?.unicode);
    }
  });
});
