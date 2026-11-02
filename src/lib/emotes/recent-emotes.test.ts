// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { RECENT_EMOTES_LIMIT, loadRecentEmotes, rememberRecentEmote } from "./recent-emotes";

describe("recent emotes", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(loadRecentEmotes()).toEqual([]);
  });

  it("keeps the newest first without duplicates", () => {
    rememberRecentEmote("KEKW");
    rememberRecentEmote("Pog");
    expect(rememberRecentEmote("KEKW")).toEqual(["KEKW", "Pog"]);
    expect(loadRecentEmotes()).toEqual(["KEKW", "Pog"]);
  });

  it("caps the list", () => {
    for (let i = 0; i < RECENT_EMOTES_LIMIT + 5; i++) rememberRecentEmote(`e${i}`);
    const recent = loadRecentEmotes();
    expect(recent).toHaveLength(RECENT_EMOTES_LIMIT);
    expect(recent[0]).toBe(`e${RECENT_EMOTES_LIMIT + 4}`);
  });

  it("drops corrupted or invalid entries", () => {
    localStorage.setItem("rede:emotes:recent:v1", "{not json");
    expect(loadRecentEmotes()).toEqual([]);
    localStorage.setItem("rede:emotes:recent:v1", JSON.stringify(["ok", 3, "has space", "a]b"]));
    expect(loadRecentEmotes()).toEqual(["ok"]);
  });
});
