import { replaceEqualDeep } from "@tanstack/react-query";

import type { FeedPages } from "@/types/lib/feed/feed-pages";
import { describe, expect, it } from "vitest";

import { keepPostsById } from "./keep-posts-by-id";

function post(id: string, reposts = 0) {
  return {
    id,
    authorId: "u1",
    authorUsername: "ana",
    authorName: "Ana",
    type: "INSIGHT" as const,
    content: `Post ${id}`,
    tags: [],
    mediaIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    counters: { likes: 0, comments: 0, reposts },
    repostWithOpinion: false,
    repostOfMediaIds: [],
    authorBadges: [],
    communityNotes: [],
    currentUserReposted: false,
    media: [],
    mediaSpoiler: false,
    authorHumanityVerified: false,
  };
}

function pages(...groups: string[][]): FeedPages {
  return {
    pages: groups.map((ids) => ({ items: ids.map((id) => post(id)), nextCursor: null })),
    pageParams: groups.map(() => null),
  };
}

describe("keepPostsById", () => {
  it("preserves post identity when a new post pushes others down", () => {
    const old = pages(["a", "b", "c"]);
    const updated = pages(["new", "a", "b"], ["c"]);

    const result = keepPostsById(old, updated) as FeedPages;

    // Posts a, b, c devem manter a mesma referencia
    const oldA = old.pages[0].items[0];
    const resultA = result.pages[0].items[1];
    expect(resultA).toBe(oldA);

    const oldB = old.pages[0].items[1];
    const resultB = result.pages[0].items[2];
    expect(resultB).toBe(oldB);

    const oldC = old.pages[0].items[2];
    const resultC = result.pages[1].items[0];
    expect(resultC).toBe(oldC);
  });

  it("returns new object when a post changes", () => {
    const old = pages(["a", "b"]);
    const newData: FeedPages = {
      pages: [{ items: [post("a", 5), post("b")], nextCursor: null }],
      pageParams: [null],
    };

    const result = keepPostsById(old, newData) as FeedPages;

    // a mudou (reposts: 0 -> 5), deve ser objeto novo
    expect(result.pages[0].items[0]).not.toBe(old.pages[0].items[0]);
    expect(result.pages[0].items[0].counters.reposts).toBe(5);

    // b nao mudou, deve manter referencia
    expect(result.pages[0].items[1]).toBe(old.pages[0].items[1]);
  });

  it("returns oldData when nothing changed", () => {
    const old = pages(["a", "b"]);
    const same = pages(["a", "b"]);

    // replaceEqualDeep ja retorna old quando sao iguais; keepPostsById nao interfere
    const result = keepPostsById(old, same);
    expect(result).toBe(old);
  });

  it("falls back to replaceEqualDeep for non-feed data", () => {
    const old = { foo: 1 };
    const updated = { foo: 1 };
    expect(keepPostsById(old, updated)).toBe(old);
  });

  it("handles empty pages", () => {
    const old = pages([]);
    const updated = pages(["a"]);
    const result = keepPostsById(old, updated) as FeedPages;
    expect(result.pages[0].items[0].id).toBe("a");
  });
});
