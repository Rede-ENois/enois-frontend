import type { GlobalEmote } from "@/types/application/emote/global-emote";
import { afterEach, describe, expect, it, vi } from "vitest";

import { applyEmotes, emoteIndex, fetchGlobalEmotes } from "./catalog";

const KEKW: GlobalEmote = {
  code: "KEKW",
  url: "https://cdn.betterttv.net/emote/abc/2x.png",
  preview: "https://cdn.betterttv.net/emote/abc/1x.png",
  provider: "BTTV",
};
const CATJAM: GlobalEmote = {
  code: "catJAM",
  url: "https://cdn.frankerfacez.com/emote/1/2",
  preview: "https://cdn.frankerfacez.com/emote/1/1",
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

/** Mesmo formato das duas APIs reais, com os casos que importam: estático, animado e repetido. */
const BTTV_RESPONSE = [
  { id: "abc", code: "KEKW", imageType: "png", animated: false },
  { id: "def", code: "HYPERGIF", imageType: "gif", animated: true },
];

const FFZ_RESPONSE = {
  default_sets: [3],
  sets: {
    // Fora do `default_sets`: o FFZ tem sets que não são a coleção global (efeitos/modificadores).
    "9": { emoticons: [{ id: 90, name: "FORADODEFAULT", urls: { "2": "ffz/90/2" } }] },
    "3": {
      emoticons: [
        { id: 1, name: "KEKW", urls: { "1": "ffz/1/1", "2": "ffz/1/2" } },
        { id: 2, name: "catJAM", urls: { "1": "ffz/2/1", "2": "ffz/2/2" } },
        {
          id: 3,
          name: "POPCAT",
          urls: { "2": "ffz/3/2" },
          animated: { "1": "ffz/3/animated/1", "2": "ffz/3/animated/2" },
        },
        { id: 4, name: "escondido", hidden: true, urls: { "2": "ffz/4/2" } },
        { id: 5, name: "", urls: { "2": "ffz/5/2" } },
        { id: 6, name: "SEMURL" },
      ],
    },
  },
};

function fakeFetch(ffzOk = true) {
  return vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("betterttv")) {
      return { ok: true, json: async () => BTTV_RESPONSE };
    }
    if (!ffzOk) return { ok: false, status: 503, json: async () => ({}) };
    return { ok: true, json: async () => FFZ_RESPONSE };
  });
}

function findByCode(emotes: GlobalEmote[], code: string): GlobalEmote | undefined {
  return emotes.find((emote) => emote.code === code);
}

describe("fetchGlobalEmotes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("figurinha estática do BTTV: 2x no chat e 1x na grade", async () => {
    vi.stubGlobal("fetch", fakeFetch());
    const keKW = findByCode(await fetchGlobalEmotes(), "KEKW");

    expect(keKW).toEqual({
      code: "KEKW",
      url: "https://cdn.betterttv.net/emote/abc/2x.png",
      preview: "https://cdn.betterttv.net/emote/abc/1x.png",
      provider: "BTTV",
    });
  });

  it("figurinha animada do BTTV entra como GIF no chat e como PNG na grade", async () => {
    vi.stubGlobal("fetch", fakeFetch());
    const gif = findByCode(await fetchGlobalEmotes(), "HYPERGIF");

    expect(gif?.url).toBe("https://cdn.betterttv.net/emote/def/1x.gif");
    expect(gif?.preview).toBe("https://cdn.betterttv.net/emote/def/1x.png");
  });

  it("figurinha animada do FFZ usa a versão em movimento (e a 1x na grade)", async () => {
    vi.stubGlobal("fetch", fakeFetch());
    const popcat = findByCode(await fetchGlobalEmotes(), "POPCAT");

    expect(popcat).toEqual({
      code: "POPCAT",
      url: "ffz/3/animated/2",
      preview: "ffz/3/animated/1",
      provider: "FFZ",
    });
  });

  it("figurinha estática do FFZ mantém a escala 2 no chat e a 1 na grade", async () => {
    vi.stubGlobal("fetch", fakeFetch());
    const catJam = findByCode(await fetchGlobalEmotes(), "catJAM");

    expect(catJam?.url).toBe("ffz/2/2");
    expect(catJam?.preview).toBe("ffz/2/1");
  });

  it("descarta escondida, sem nome e sem endereço, e ignora set fora da coleção global", async () => {
    vi.stubGlobal("fetch", fakeFetch());
    const codes = (await fetchGlobalEmotes()).map((emote) => emote.code);

    expect(codes).toEqual(["catJAM", "HYPERGIF", "KEKW", "POPCAT"]);
  });

  it("o BTTV vence quando o código existe nas duas coleções", async () => {
    vi.stubGlobal("fetch", fakeFetch());
    const keKW = findByCode(await fetchGlobalEmotes(), "KEKW");

    expect(keKW?.provider).toBe("BTTV");
  });

  it("com o FFZ fora do ar a coleção do BTTV continua valendo", async () => {
    vi.stubGlobal("fetch", fakeFetch(false));
    const codes = (await fetchGlobalEmotes()).map((emote) => emote.code);

    expect(codes).toEqual(["HYPERGIF", "KEKW"]);
  });
});
