// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { loadCachedIndex, saveCachedIndex } from "./catalog-cache";

const CHAVE = "rede:emotes:index:v3";

const ENTRIES = {
  KEKW: "/emotes/image/BTTV/abc?variant=full",
  catJAM: "/emotes/image/FFZ/1?variant=full&a=1",
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("cache do índice de figurinhas", () => {
  it("guarda e devolve o índice com o horário em que foi salvo", () => {
    saveCachedIndex(ENTRIES, 1_700_000_000_000);

    expect(loadCachedIndex()).toEqual({ entries: ENTRIES, savedAt: 1_700_000_000_000 });
  });

  it("sem nada salvo devolve null", () => {
    expect(loadCachedIndex()).toBeNull();
  });

  it("JSON quebrado não derruba o texto", () => {
    window.localStorage.setItem(CHAVE, "{isso não é json");

    expect(loadCachedIndex()).toBeNull();
  });

  it("descarta o formato antigo (lista das coleções globais com URL de CDN)", () => {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({
        entries: [{ code: "KEKW", url: "https://cdn.betterttv.net/emote/abc/2x.png" }],
        savedAt: 1,
      }),
    );

    expect(loadCachedIndex()).toBeNull();
  });

  it("só aceita caminho do proxy de figurinhas", () => {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({
        entries: {
          ...ENTRIES,
          EXTERNO: "https://cdn.betterttv.net/emote/abc/2x.png",
          SCRIPT: "javascript:alert(1)",
          FUGA: "/emotes/image/BTTV/abc) ![x](http://mal/",
          PROVEDOR: "/emotes/image/FFZ/2?variant=thumb",
        },
        savedAt: 9,
      }),
    );

    expect(Object.keys(loadCachedIndex()?.entries ?? {}).sort()).toEqual([
      "KEKW",
      "PROVEDOR",
      "catJAM",
    ]);
  });

  it("índice vazio não sobrescreve a cópia boa", () => {
    saveCachedIndex(ENTRIES, 10);
    saveCachedIndex({}, 20);

    expect(loadCachedIndex()?.entries).toEqual(ENTRIES);
  });

  it("guarda a figurinha cujo código tem símbolo", () => {
    saveCachedIndex({ ":D": "/emotes/image/BTTV/x?variant=full" }, 3);

    expect(loadCachedIndex()?.entries).toEqual({ ":D": "/emotes/image/BTTV/x?variant=full" });
  });
});
