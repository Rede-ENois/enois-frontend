// @vitest-environment jsdom
import { act } from "react";

import { QueryClient } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedLiveScope } from "@/types/lib/feed/feed-live-scope";
import type { FeedPages } from "@/types/lib/feed/feed-pages";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FEED_LIVE_REFRESH_MS, useFeedLiveRefresh } from "./feed-live";

function Probe(props: FeedLiveScope) {
  useFeedLiveRefresh(props);
  return null;
}

function post(reactions = 0): PostView {
  return {
    id: "p1",
    authorId: "autor",
    authorUsername: "autor",
    authorName: "Autor",
    authorAvatar: null,
    type: "INSIGHT",
    content: "texto antigo",
    tags: [],
    mediaIds: [],
    createdAt: "2026-11-02T00:00:00Z",
    visibility: "PUBLIC",
    counters: { reactions, comments: 0, saves: 0, shares: 0, reposts: 0 },
    status: "ACTIVE",
  };
}

describe("atualização dos campos na varredura do feed", () => {
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

  it("atualiza os mesmos ids e mantém a referência numa resposta idêntica", async () => {
    const key = ["feed", "ALL", "", ""] as const;
    client.setQueryData<FeedPages>(key, {
      pages: [{ items: [post()], nextCursor: null }],
      pageParams: [null],
    });
    const queryFn = vi.fn().mockImplementation(async () => ({
      items: [{ ...post(9), content: "texto editado" }],
      nextCursor: null,
    }));
    const query = client.getQueryCache().find({ queryKey: key, exact: true })!;
    query.options.queryFn = queryFn;

    await act(async () => root.render(<Probe queryClient={client} queryKey={key} enabled />));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FEED_LIVE_REFRESH_MS);
    });

    const updated = client.getQueryData<FeedPages>(key)!;
    expect(updated.pages[0].items).toHaveLength(1);
    expect(updated.pages[0].items[0].content).toBe("texto editado");
    expect(updated.pages[0].items[0].counters.reactions).toBe(9);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FEED_LIVE_REFRESH_MS);
    });

    expect(client.getQueryData(key)).toBe(updated);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
