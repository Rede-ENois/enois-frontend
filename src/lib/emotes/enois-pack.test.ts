import { describe, expect, it } from "vitest";

import { ENOIS_CUSTOM_EMOJIS, getEnoisEmojiByCode, getEnoisEmojiSrc } from "./enois-pack";

describe("pacote É Nóis", () => {
  it(":enois_heart_purple: é o mesmo coração roxo da reação", () => {
    expect(getEnoisEmojiByCode("enois_heart_purple")?.code).toBe("enois_heart_purple");
    expect(getEnoisEmojiSrc("enois_heart_purple")).toBe("/emojis/enois/heart_purple.svg");
  });

  it("o coração roxo é uma posição só, e o nome curto da reação chega nela", () => {
    const posicoes = ENOIS_CUSTOM_EMOJIS.filter((item) => item.src.endsWith("heart_purple.svg"));
    expect(posicoes.map((item) => item.code)).toEqual(["enois_heart_purple"]);
    expect(getEnoisEmojiByCode("heart_purple")).toBe(posicoes[0]);
  });
});
