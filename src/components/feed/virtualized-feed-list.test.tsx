// @vitest-environment jsdom
import { act } from "react";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VirtualizedFeedList } from "./virtualized-feed-list";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/components/post-card", () => ({ PostCard: () => null }));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

describe("VirtualizedFeedList scroll probe", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    // O jsdom não implementa a API usada pelo virtualizador ao montar a lista.
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
  });

  const render = () =>
    act(() =>
      root.render(
        <VirtualizedFeedList
          posts={[]}
          feedTab="ALL"
          caughtUpAt={null}
          firstPostRef={() => undefined}
          hasMore={false}
          loadingMore={false}
          onLoadMore={() => undefined}
          loadingLabel="..."
          endLabel="fim"
        />,
      ),
    );

  const button = () =>
    [...host.querySelectorAll("button")].find(
      (element) => element.textContent === texts.feed.scrollDebug.copy,
    );

  it("shows nothing extra by default", async () => {
    await render();
    expect(button()).toBeUndefined();
  });

  it("offers the report when the feed is opened with ?debug=scroll", async () => {
    window.history.replaceState(null, "", "/feed?debug=scroll");
    await render();
    expect(button()).toBeDefined();
  });
});
