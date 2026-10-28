import type { GlobalEmote } from "@/types/application/emote/global-emote";
import { describe, expect, it } from "vitest";

import { applyEmotes, emoteIndex } from "./catalog";

const KEKW: GlobalEmote = {
  code: "KEKW",
  url: "https://cdn.betterttv.net/emote/abc/2x.png",
  provider: "BTTV",
};
const CATJAM: GlobalEmote = {
  code: "catJAM",
  url: "https://cdn.frankerfacez.com/emoticon/1/2",
  provider: "FFZ",
};

const index = emoteIndex([KEKW, CATJAM]);
const IMG_KEKW = `![KEKW](${KEKW.url})`;

describe("applyEmotes", () => {
  it("troca o código no meio da frase sem mexer no resto", () => {
    expect(applyEmotes("olha isso KEKW que engraçado", index)).toBe(
      `olha isso ${IMG_KEKW} que engraçado`,
    );
  });

  it("aceita mais de uma figurinha e preserva a pontuação em volta", () => {
    expect(applyEmotes("(KEKW) e catJAM!", index)).toBe(
      `(${IMG_KEKW}) e ![catJAM](${CATJAM.url})!`,
    );
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
