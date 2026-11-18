import { describe, expect, it } from "vitest";

import { withoutRepeatedPosts } from "./repeated-posts";

function page(...ids: string[]) {
  return { items: ids.map((id) => ({ id })), nextCursor: null };
}

function ids(pages: { items: { id: string }[] }[]) {
  return pages.map((p) => p.items.map((i) => i.id));
}

describe("withoutRepeatedPosts", () => {
  it("keeps every post when there are no repeats", () => {
    const pages = [page("a", "b"), page("c", "d")];
    expect(ids(withoutRepeatedPosts(pages))).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("drops a post that a later page repeats", () => {
    const pages = [page("a", "b"), page("c", "a", "d")];
    expect(ids(withoutRepeatedPosts(pages))).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("drops a post repeated within the same page", () => {
    const pages = [page("a", "b", "a")];
    expect(ids(withoutRepeatedPosts(pages))).toEqual([["a", "b"]]);
  });

  it("preserves page identity when nothing is filtered", () => {
    const original = [page("a", "b"), page("c", "d")];
    const result = withoutRepeatedPosts(original);
    expect(result[0]).toBe(original[0]);
    expect(result[1]).toBe(original[1]);
  });

  it("returns empty for empty input", () => {
    expect(withoutRepeatedPosts([])).toEqual([]);
  });
});
