import { describe, expect, it } from "vitest";

import { emoteImageUrl } from "./api";
import { BARE_EMOTE_CODES_UNTIL, applyEmotes, emoteIndex, usesBareEmoteCodes } from "./catalog";

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

describe("applyEmotes, bare codes (text written before #556)", () => {
  it("troca o código no meio da frase sem mexer no resto", () => {
    expect(applyEmotes("olha isso KEKW que engraçado", index, true)).toBe(
      `olha isso ${IMG_KEKW} que engraçado`,
    );
  });

  it("aceita mais de uma figurinha e preserva a pontuação em volta", () => {
    expect(applyEmotes("(KEKW) e catJAM!", index, true)).toBe(`(${IMG_KEKW}) e ${IMG_CATJAM}!`);
  });

  it("não troca pedaço de palavra nem código desconhecido", () => {
    expect(applyEmotes("hiKEKW KEKWX naoexiste", index, true)).toBe("hiKEKW KEKWX naoexiste");
  });

  it("deixa bloco e trecho de código como estão", () => {
    const texto = "antes KEKW\n```\nKEKW no codigo\n```\ne `KEKW` inline";
    expect(applyEmotes(texto, index, true)).toBe(
      `antes ${IMG_KEKW}\n\`\`\`\nKEKW no codigo\n\`\`\`\ne \`KEKW\` inline`,
    );
  });

  it("sem catálogo devolve o texto original", () => {
    expect(applyEmotes("KEKW", new Map(), true)).toBe("KEKW");
  });

  it("preserva quebras de linha e linhas vazias", () => {
    const texto = "primeira\n\nKEKW na terceira";
    expect(applyEmotes(texto, index, true)).toBe(`primeira\n\n${IMG_KEKW} na terceira`);
  });
});

describe("applyEmotes, colon codes (#556)", () => {
  it("only :code: becomes a sticker; a bare word stays a word", () => {
    expect(applyEmotes("KEKW e :KEKW:", index)).toBe(`KEKW e ${IMG_KEKW}`);
  });

  it("accepts adjacent codes and punctuation around them", () => {
    expect(applyEmotes("(:KEKW::catJAM:)!", index)).toBe(`(${IMG_KEKW}${IMG_CATJAM})!`);
  });

  it("leaves unknown codes, times and inline code alone", () => {
    expect(applyEmotes(":naoexiste: 12:30:45 `:KEKW:`", index)).toBe(
      ":naoexiste: 12:30:45 `:KEKW:`",
    );
  });

  it("old text renders both formats", () => {
    expect(applyEmotes("KEKW :catJAM:", index, true)).toBe(`${IMG_KEKW} ${IMG_CATJAM}`);
  });
});

describe("usesBareEmoteCodes", () => {
  it("is true only for text written before the cutoff", () => {
    expect(usesBareEmoteCodes(new Date(BARE_EMOTE_CODES_UNTIL - 1).toISOString())).toBe(true);
    expect(usesBareEmoteCodes(new Date(BARE_EMOTE_CODES_UNTIL).toISOString())).toBe(false);
    expect(usesBareEmoteCodes(undefined)).toBe(false);
    expect(usesBareEmoteCodes("not a date")).toBe(false);
  });
});
