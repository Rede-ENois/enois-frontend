// @vitest-environment jsdom
import { act } from "react";

import { QueryClient } from "@tanstack/react-query";

import type { FeedLiveScope } from "@/types/lib/feed/feed-live-scope";
import type { FeedPages } from "@/types/lib/feed/feed-pages";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FEED_LIVE_REFRESH_MS, useFeedLiveRefresh } from "./feed-live";

function Probe(props: FeedLiveScope) {
  useFeedLiveRefresh(props);
  return null;
}

describe("rodízio da varredura do feed", () => {
  const key = ["feed", "ALL", "", ""] as const;
  let client: QueryClient;
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function seed(queryKey: readonly unknown[], count: number) {
    const pageParams = Array.from({ length: count }, (_, index) =>
      index === 0 ? null : `cursor-${index}`,
    );
    client.setQueryData<FeedPages>(queryKey, {
      pages: pageParams.map(() => ({ items: [], nextCursor: null })),
      pageParams,
    });
    const queryFn = vi.fn(async (_context: { pageParam?: unknown }) => ({
      items: [],
      nextCursor: null,
    }));
    const query = client.getQueryCache().find({ queryKey, exact: true })!;
    query.options.queryFn = queryFn;
    return queryFn;
  }

  async function render(queryKey: readonly unknown[] = key) {
    await act(async () => root.render(<Probe queryClient={client} queryKey={queryKey} enabled />));
  }

  async function tick() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FEED_LIVE_REFRESH_MS);
    });
  }

  it("alcança todas as páginas com no máximo duas buscas por rodada", async () => {
    const queryFn = seed(key, 5);
    await render();

    await tick();
    expect(queryFn.mock.calls.map(([context]) => context.pageParam)).toEqual([null, "cursor-1"]);

    await render([...key]);
    await tick();
    expect(queryFn.mock.calls.map(([context]) => context.pageParam)).toEqual([
      null,
      "cursor-1",
      "cursor-2",
      "cursor-3",
    ]);

    await tick();
    expect(queryFn.mock.calls.map(([context]) => context.pageParam)).toEqual([
      null,
      "cursor-1",
      "cursor-2",
      "cursor-3",
      "cursor-4",
      null,
    ]);
  });

  it.each([0, 1])(
    "não inventa nem repete páginas dentro da rodada com %s carregadas",
    async (count) => {
      const queryFn = seed(key, count);
      await render();

      await tick();
      expect(queryFn).toHaveBeenCalledTimes(count);

      await tick();
      expect(queryFn).toHaveBeenCalledTimes(count * 2);
    },
  );

  it("ajusta o índice quando a lista diminui e volta a crescer", async () => {
    const queryFn = seed(key, 5);
    await render();
    await tick();

    client.setQueryData<FeedPages>(key, {
      pages: [{ items: [], nextCursor: null }],
      pageParams: [null],
    });
    await tick();

    expect(queryFn).toHaveBeenCalledTimes(3);
    expect(queryFn.mock.calls[2][0].pageParam).toBeNull();

    client.setQueryData<FeedPages>(key, {
      pages: [
        { items: [], nextCursor: "cursor-1" },
        { items: [], nextCursor: "cursor-2" },
        { items: [], nextCursor: null },
      ],
      pageParams: [null, "cursor-1", "cursor-2"],
    });
    await tick();
    await tick();

    expect(queryFn).toHaveBeenCalledTimes(7);
    expect(queryFn.mock.calls.slice(-2).map(([context]) => context.pageParam)).toEqual([
      "cursor-2",
      null,
    ]);
  });

  it("começa uma consulta diferente pela primeira página", async () => {
    const otherKey = ["feed", "TRENDING", "", ""] as const;
    const first = seed(key, 5);
    const other = seed(otherKey, 3);

    await render();
    await tick();
    await render(otherKey);
    await tick();

    expect(first).toHaveBeenCalledTimes(2);
    expect(other.mock.calls.map(([context]) => context.pageParam)).toEqual([null, "cursor-1"]);
  });
});
