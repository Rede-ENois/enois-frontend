import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";
import { describe, expect, it } from "vitest";

import {
  adoptsFirstPage,
  countNewPosts,
  holdsFirstPage,
  pagesWithHeldFirst,
} from "./feed-arrivals";

function post(id: string): PostView {
  return {
    id,
    authorId: "author",
    authorUsername: "ana",
    authorName: "Ana",
    authorAvatar: null,
    type: "INSIGHT",
    content: "",
    tags: [],
    mediaIds: [],
    createdAt: "2026-11-02T00:00:00Z",
    visibility: "PUBLIC",
    counters: { reactions: 1, comments: 2, saves: 3, shares: 4, reposts: 5 },
    status: "ACTIVE",
  };
}

function page(...ids: string[]): PageResponse<PostView> {
  return { items: ids.map(post), nextCursor: "cursor" };
}

function ids(pages: PageResponse<PostView>[]): string[][] {
  return pages.map((p) => p.items.map((item) => item.id));
}

describe("adoptsFirstPage", () => {
  it("treats the newest-first tabs as chronological", () => {
    expect(adoptsFirstPage("ALL")).toBe(true);
    expect(adoptsFirstPage("COMMUNITY")).toBe(true);
    expect(adoptsFirstPage("CORPORATE")).toBe(true);
  });

  it("keeps the backend ranking of 'Para você'", () => {
    expect(adoptsFirstPage("FOR_YOU")).toBe(false);
    expect(adoptsFirstPage("TRENDING")).toBe(false);
  });
});

describe("countNewPosts", () => {
  it("counts the posts before the first one the reader already had", () => {
    const known = new Set(["p3", "p4"]);
    expect(countNewPosts(known, page("p1", "p2", "p3", "p4"))).toBe(2);
  });

  it("counts none when the page starts with a known post", () => {
    expect(countNewPosts(new Set(["p1"]), page("p1", "p2"))).toBe(0);
  });
});

describe("holdsFirstPage", () => {
  const previous = [post("p3"), post("p4"), post("p5")];

  it("holds posts that arrived at the top while the reader is scrolled down", () => {
    expect(holdsFirstPage(previous, page("p1", "p2", "p3"), true, 2400)).toBe(true);
  });

  it("never holds while the reader is at the top", () => {
    expect(holdsFirstPage(previous, page("p1", "p2", "p3"), true, 0)).toBe(false);
  });

  it("lets the first page of a tab or filter in", () => {
    expect(holdsFirstPage([], page("p1"), true, 2400)).toBe(false);
  });

  it("lets an unchanged first page in", () => {
    expect(holdsFirstPage(previous, page("p3", "p4", "p5"), true, 2400)).toBe(false);
  });

  it("holds a reordered ranking without new posts", () => {
    // "Para você" ranks by affinity: the same posts in another order still move the list.
    expect(holdsFirstPage(previous, page("p5", "p4", "p3"), false, 2400)).toBe(true);
  });

  it("holds a new post in a ranking even when the first post did not change", () => {
    expect(holdsFirstPage(previous, page("p3", "p4", "p1"), false, 2400)).toBe(true);
  });
});

describe("pagesWithHeldFirst", () => {
  it("returns the pages of the query while nothing is held", () => {
    const pages = [page("p1", "p2"), page("p3")];
    expect(ids(pagesWithHeldFirst({ pages, pageParams: [] }, null))).toEqual([
      ["p1", "p2"],
      ["p3"],
    ]);
  });

  it("returns no pages before the first load", () => {
    expect(pagesWithHeldFirst(undefined, null)).toEqual([]);
  });

  it("keeps the page the reader had in front of the pages loaded after it", () => {
    const held = { pages: [page("p3", "p4")], count: 2 };
    const data = { pages: [page("p1", "p2"), page("p5", "p6")], pageParams: [] };
    expect(ids(pagesWithHeldFirst(data, held))).toEqual([
      ["p3", "p4"],
      ["p5", "p6"],
    ]);
  });

  it("drops the posts a prepend pushed into the next page", () => {
    // Two posts arrived at the top: the page after the first now starts with posts the reader
    // already has, and a repeated id would be measured as the same card twice.
    const held = { pages: [page("p3", "p4"), page("p5", "p6")], count: 2 };
    const data = { pages: [page("p1", "p2"), page("p3", "p4", "p5", "p6", "p7")], pageParams: [] };
    expect(ids(pagesWithHeldFirst(data, held))).toEqual([
      ["p3", "p4"],
      ["p5", "p6", "p7"],
    ]);
  });
});
