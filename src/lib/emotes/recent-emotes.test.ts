// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { RECENT_EMOTES_LIMIT, loadRecentEmotes, rememberRecentEmote } from "./recent-emotes";

const KEKW = { code: "KEKW", thumb: "/emotes/image/BTTV/1?variant=thumb" };
const POG = { code: "Pog", thumb: "/emotes/image/FFZ/2?variant=thumb" };

describe("recent emotes", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(loadRecentEmotes()).toEqual([]);
  });

  it("keeps the newest first without duplicates", () => {
    rememberRecentEmote(KEKW);
    rememberRecentEmote(POG);
    expect(rememberRecentEmote(KEKW)).toEqual([KEKW, POG]);
    expect(loadRecentEmotes()).toEqual([KEKW, POG]);
  });

  it("caps the list", () => {
    for (let i = 0; i < RECENT_EMOTES_LIMIT + 5; i++) {
      rememberRecentEmote({ code: `e${i}`, thumb: `/emotes/image/BTTV/${i}?variant=thumb` });
    }
    const recent = loadRecentEmotes();
    expect(recent).toHaveLength(RECENT_EMOTES_LIMIT);
    expect(recent[0]?.code).toBe(`e${RECENT_EMOTES_LIMIT + 4}`);
  });

  it("drops corrupted or invalid entries", () => {
    localStorage.setItem("rede:emotes:recent:v1", "{not json");
    expect(loadRecentEmotes()).toEqual([]);
    localStorage.setItem(
      "rede:emotes:recent:v1",
      JSON.stringify(["ok", 3, "has space", "a]b", null, { code: 7 }]),
    );
    expect(loadRecentEmotes()).toEqual([{ code: "ok", thumb: null }]);
  });

  it("never keeps an image from outside the proxy", () => {
    localStorage.setItem(
      "rede:emotes:recent:v1",
      JSON.stringify([{ code: "KEKW", thumb: "https://tracker.example/pixel.gif" }, POG]),
    );
    expect(loadRecentEmotes()).toEqual([{ code: "KEKW", thumb: null }, POG]);
  });
});
