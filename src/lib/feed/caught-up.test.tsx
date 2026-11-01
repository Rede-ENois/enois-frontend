// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { carriesCaughtUp, caughtUpOrder, newestCreatedAt, useMarkFeedSeen } from "./caught-up";

const mocks = vi.hoisted(() => ({ markSeen: vi.fn() }));
vi.mock("@/lib/api", () => ({ feedApi: { markSeen: mocks.markSeen } }));

const at = (createdAt: string) => ({ createdAt });

describe("'Você está em dia' on 'Para você'", () => {
  const post = (id: string, createdAt: string) => ({ id, createdAt });
  // API order by relevance: a liked old post (o1) comes before a new one (n2).
  const posts = [
    post("n1", "2026-10-30T12:00:00Z"),
    post("o1", "2026-10-28T08:00:00Z"),
    post("n2", "2026-10-30T14:00:00Z"),
    post("o2", "2026-10-29T08:00:00Z"),
  ];
  const ids = (list: { id: string }[]) => list.map((item) => item.id);

  it("puts the new posts first, newest first, then the divider and the rest in API order", () => {
    const { posts: ordered, caughtUpAt } = caughtUpOrder(posts, "2026-10-30T10:00:00Z");
    expect(ids(ordered)).toEqual(["n2", "n1", "o1", "o2"]);
    expect(caughtUpAt).toBe(2);
  });

  it("a post exactly at the marker counts as seen", () => {
    expect(caughtUpOrder(posts, "2026-10-30T12:00:00Z").caughtUpAt).toBe(1);
  });

  it("keeps the API order and no divider without a marker", () => {
    expect(caughtUpOrder(posts, null)).toEqual({ posts, caughtUpAt: -1 });
  });

  it("no divider when nothing is new or no old post is loaded yet", () => {
    expect(caughtUpOrder(posts, "2026-10-31T00:00:00Z").caughtUpAt).toBe(-1);
    const allNew = caughtUpOrder(posts, "2026-10-01T00:00:00Z");
    expect(ids(allNew.posts)).toEqual(["n2", "n1", "o2", "o1"]);
    expect(allNew.caughtUpAt).toBe(-1);
  });

  it("o mais novo não precisa ser o primeiro (feed ranqueado)", () => {
    expect(newestCreatedAt([at("2026-10-29T00:00:00Z"), at("2026-10-30T00:00:00Z")])).toBe(
      "2026-10-30T00:00:00Z",
    );
    expect(newestCreatedAt([])).toBeNull();
  });
});

describe("marcar o feed como visto", () => {
  let callback: IntersectionObserverCallback;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.markSeen.mockResolvedValue(undefined);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    root = createRoot(document.createElement("div"));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });

  function Feed({ posts, enabled = true }: { posts: { createdAt: string }[]; enabled?: boolean }) {
    const ref = useMarkFeedSeen(posts, enabled);
    return <div ref={ref} />;
  }

  const fire = (isIntersecting: boolean, bottom: number) =>
    act(() =>
      callback(
        [{ isIntersecting, boundingClientRect: { bottom } } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );

  it("só marca quando o primeiro post sai pelo topo, uma vez por visita", () => {
    act(() =>
      root.render(<Feed posts={[at("2026-10-29T00:00:00Z"), at("2026-10-30T00:00:00Z")]} />),
    );

    fire(true, 100);
    fire(false, 900); // saiu por baixo (rolou para cima): não conta
    expect(mocks.markSeen).not.toHaveBeenCalled();

    fire(false, -10);
    fire(false, -20);
    expect(mocks.markSeen).toHaveBeenCalledTimes(1);
    expect(mocks.markSeen).toHaveBeenCalledWith("2026-10-30T00:00:00Z");
  });

  it("never marks outside 'Para você'", () => {
    act(() => root.render(<Feed posts={[at("2026-10-30T00:00:00Z")]} enabled={false} />));

    fire(false, -10);
    expect(mocks.markSeen).not.toHaveBeenCalled();
  });
});

describe("tabs that carry the marker", () => {
  it("only 'Para você'", () => {
    expect(carriesCaughtUp("FOR_YOU")).toBe(true);
    for (const tab of [
      "ALL",
      "UNSEEN",
      "PROJECTS",
      "TRENDING",
      "INTERACTED",
      "CORPORATE",
    ] as const) {
      expect(carriesCaughtUp(tab)).toBe(false);
    }
  });
});
