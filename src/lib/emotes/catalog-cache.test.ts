// @vitest-environment jsdom
import type { GlobalEmote } from "@/types/application/emote/global-emote";
import { beforeEach, describe, expect, it } from "vitest";

import { loadCachedEmotes, saveCachedEmotes } from "./catalog-cache";

const KEKW: GlobalEmote = {
  code: "KEKW",
  url: "https://cdn.betterttv.net/emote/abc/2x.png",
  preview: "https://cdn.betterttv.net/emote/abc/1x.png",
  provider: "BTTV",
};

const CHAVE = "rede:emotes:global";

beforeEach(() => {
  window.localStorage.clear();
});

describe("cache do catálogo de figurinhas", () => {
  it("guarda e devolve a lista com o horário em que foi salva", () => {
    saveCachedEmotes([KEKW], 1_700_000_000_000);

    expect(loadCachedEmotes()).toEqual({ emotes: [KEKW], savedAt: 1_700_000_000_000 });
  });

  it("sem nada salvo devolve null", () => {
    expect(loadCachedEmotes()).toBeNull();
  });

  it("JSON quebrado não derruba o seletor", () => {
    window.localStorage.setItem(CHAVE, "{isso não é json");

    expect(loadCachedEmotes()).toBeNull();
  });

  it("descarta item salvo por uma versão antiga (sem a miniatura)", () => {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({ emotes: [{ code: "OLD", url: "u", provider: "BTTV" }], savedAt: 1 }),
    );

    expect(loadCachedEmotes()).toBeNull();
  });

  it("mantém os itens válidos e joga fora o resto", () => {
    const dados = {
      emotes: [KEKW, { code: "SEMPROVEDOR", url: "u", preview: "p" }, null, 7],
      savedAt: 42,
    };
    window.localStorage.setItem(CHAVE, JSON.stringify(dados));

    expect(loadCachedEmotes()).toEqual({ emotes: [KEKW], savedAt: 42 });
  });

  it("lista vazia não sobrescreve a cópia boa", () => {
    saveCachedEmotes([KEKW], 10);
    saveCachedEmotes([], 20);

    expect(loadCachedEmotes()?.emotes).toHaveLength(1);
  });
});
