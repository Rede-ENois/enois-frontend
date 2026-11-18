import { describe, expect, it } from "vitest";

import { REACTION_EMOJIS, REACTION_EMOJI_ASSETS } from "./reaction-emojis";

describe("REACTION_EMOJI_ASSETS", () => {
  it("cobre todas as reações oficiais com figurinha única e sem repetições", () => {
    const types = Object.keys(REACTION_EMOJIS);
    const assetKeys = Object.keys(REACTION_EMOJI_ASSETS);
    const assets = Object.values(REACTION_EMOJI_ASSETS);

    expect(assetKeys).toEqual(types);
    expect(new Set(assets).size).toBe(assets.length);
  });
});
