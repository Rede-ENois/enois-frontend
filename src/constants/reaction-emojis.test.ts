import { REACTION_TYPES } from "@/types/application/reaction/reaction-type";
import { describe, expect, it } from "vitest";

import { ENOIS_CUSTOM_EMOJIS } from "@/lib/emotes/enois-pack";

import { REACTION_EMOJIS, REACTION_EMOJI_ASSETS } from "./reaction-emojis";

describe("REACTION_EMOJI_ASSETS", () => {
  it("cobre todas as reações oficiais com figurinha única e sem repetições", () => {
    const types = Object.keys(REACTION_EMOJIS);
    const assetKeys = Object.keys(REACTION_EMOJI_ASSETS);
    const assets = Object.values(REACTION_EMOJI_ASSETS);

    expect(assetKeys).toEqual(types);
    expect(new Set(assets).size).toBe(assets.length);
  });

  it("é a lista inteira das oficiais, sem nada de fora dela", () => {
    expect(Object.keys(REACTION_EMOJIS)).toEqual([...REACTION_TYPES]);
    expect(Object.keys(REACTION_EMOJIS)).toHaveLength(REACTION_TYPES.length);
  });

  it("cada reação aponta para um ícone do pacote É Nóis", () => {
    const srcs = new Set(ENOIS_CUSTOM_EMOJIS.map((item) => item.src));

    for (const asset of Object.values(REACTION_EMOJI_ASSETS)) {
      expect(srcs.has(asset)).toBe(true);
      expect(asset.startsWith("/emojis/enois/")).toBe(true);
    }
  });
});
