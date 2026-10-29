import { describe, expect, it } from "vitest";

import { emoteImageUrl } from "./api";
import { applyEmotes, emoteIndex } from "./catalog";

const KEKW = "/emotes/image/BTTV/abc?variant=full";
const CATJAM = "/emotes/image/FFZ/1?variant=full&a=1";

const index = emoteIndex({ KEKW, catJAM: CATJAM });
const IMG_KEKW = `![KEKW](${emoteImageUrl(KEKW)})`;
const IMG_CATJAM = `![catJAM](${emoteImageUrl(CATJAM)})`;

describe("emoteIndex", () => {
  it("vira o caminho do proxy em endereço da API", () => {
    expect(emoteIndex({ KEKW }).get("KEKW")).toBe(emoteImageUrl(KEKW));
    expect(emoteImageUrl(KEKW)).toMatch(/\/api\/emotes\/image\/BTTV\/abc\?variant=full$/);
  });

  it("endereço já absoluto passa intacto", () => {
    const url = "https://api.enois.ia.br/api/emotes/image/FFZ/9?variant=full";

    expect(emoteImageUrl(url)).toBe(url);
  });
});

describe("applyEmotes", () => {
  it("troca o código no meio da frase sem mexer no resto", () => {
    expect(applyEmotes("olha isso KEKW que engraçado", index)).toBe(
      `olha isso ${IMG_KEKW} que engraçado`,
    );
  });

  it("aceita mais de uma figurinha e preserva a pontuação em volta", () => {
    expect(applyEmotes("(KEKW) e catJAM!", index)).toBe(`(${IMG_KEKW}) e ${IMG_CATJAM}!`);
  });

  it("não troca pedaço de palavra nem código desconhecido", () => {
    expect(applyEmotes("hiKEKW KEKWX naoexiste", index)).toBe("hiKEKW KEKWX naoexiste");
  });

  it("deixa bloco e trecho de código como estão", () => {
    const texto = "antes KEKW\n```\nKEKW no codigo\n```\ne `KEKW` inline";
    expect(applyEmotes(texto, index)).toBe(
      `antes ${IMG_KEKW}\n\`\`\`\nKEKW no codigo\n\`\`\`\ne \`KEKW\` inline`,
    );
  });

  it("sem catálogo devolve o texto original", () => {
    expect(applyEmotes("KEKW", new Map())).toBe("KEKW");
  });

  it("preserva quebras de linha e linhas vazias", () => {
    const texto = "primeira\n\nKEKW na terceira";
    expect(applyEmotes(texto, index)).toBe(`primeira\n\n${IMG_KEKW} na terceira`);
  });
});
