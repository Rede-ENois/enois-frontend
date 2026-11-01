// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

import { useEmoteIndex } from "./use-emotes";

const mocks = vi.hoisted(() => ({
  load: vi.fn(() => ({ entries: { KEKW: "/emotes/image/BTTV/abc?variant=full" }, savedAt: 1 })),
}));

vi.mock("./catalog-cache", () => ({ loadCachedIndex: mocks.load, saveCachedIndex: vi.fn() }));
vi.mock("./api", () => ({
  emotesApi: { index: () => new Promise(() => {}) },
  emoteImageUrl: (path: string) => `https://api.test${path}`,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Every RichText on screen reads the index: the stored copy is parsed once and the Map is shared,
// instead of one full pass over the catalog per mounted post (the feed CPU profile, 31/10).
it("reads the stored index once and shares one Map across components", () => {
  const seen: Map<string, string>[] = [];
  function Reader() {
    seen.push(useEmoteIndex());
    return null;
  }

  const root = createRoot(document.createElement("div"));
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <Reader />
        <Reader />
        <Reader />
      </QueryClientProvider>,
    ),
  );

  expect(mocks.load).toHaveBeenCalledOnce();
  expect(new Set(seen).size).toBe(1);
  expect(seen[0].get("KEKW")).toBe("https://api.test/emotes/image/BTTV/abc?variant=full");
  act(() => root.unmount());
});
