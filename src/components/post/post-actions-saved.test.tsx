// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostActions } from "./post-actions";

const mocks = vi.hoisted(() => ({
  renders: new Map<() => void, number>(),
  saved: new Map<() => void, boolean>(),
  actions: new Map<() => void, () => Promise<void>>(),
  listSaved: vi.fn(),
  save: vi.fn(),
  removeSave: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/lib/api", () => ({
  REACTION_EMOJIS: [],
  feedApi: { listSaved: mocks.listSaved },
  reactionsApi: { save: mocks.save, removeSave: mocks.removeSave },
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "reader" } }),
}));
vi.mock("@/lib/feed/post-query-cache", () => ({ updatePostInQueryCache: () => {} }));
vi.mock("@/lib/lite-mode", () => ({
  readEconomicMode: () => false,
  readForceMotion: () => false,
  prefersReducedMotion: () => false,
}));
vi.mock("@/lib/reactions/use-post-reaction", () => ({
  usePostReaction: () => ({ toggle: () => {} }),
}));
vi.mock("@/lib/use-mounted-once", () => ({ useMountedOnce: () => false }));
vi.mock("@/stores/post-card.store", () => ({
  usePostCardStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      cards: {},
      initializePostCard: () => {},
      disposePostCard: () => {},
      setShowReactions: () => {},
      setShowReport: () => {},
    }),
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});
vi.mock("@rede-enois/design-system/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/domain")>();
  return {
    ...actual,
    PostActions: (props: {
      onComments: () => void;
      saved: boolean;
      onSave: () => Promise<void>;
    }) => {
      mocks.renders.set(props.onComments, (mocks.renders.get(props.onComments) ?? 0) + 1);
      mocks.saved.set(props.onComments, props.saved);
      mocks.actions.set(props.onComments, props.onSave);
      return null;
    },
  };
});

const first: PostView = {
  id: "first",
  authorId: "author",
  authorUsername: "author",
  authorName: "Autor",
  authorAvatar: null,
  type: "INSIGHT",
  content: "",
  tags: [],
  mediaIds: [],
  createdAt: "2026-11-01T00:00:00Z",
  visibility: "PUBLIC",
  counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
};
const second: PostView = { ...first, id: "second" };
const firstComments = () => {};
const secondComments = () => {};

describe("PostActions: salvos", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.renders.clear();
    mocks.saved.clear();
    mocks.actions.clear();
    mocks.listSaved.mockReset();
    mocks.save.mockReset();
    mocks.removeSave.mockReset();
    mocks.listSaved.mockReturnValue(new Promise(() => {}));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    vi.unstubAllGlobals();
  });

  const render = () =>
    act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <PostActions post={first} onComments={firstComments} />
          <PostActions post={second} onComments={secondComments} />
        </QueryClientProvider>,
      );
    });

  const flush = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

  const updateSavedFeed = async (items: PostView[]) => {
    await act(async () => {
      client.setQueryData(["saved-posts"], { items, nextCursor: null });
    });
    await flush();
  };

  it("renderiza somente os cards cujo estado de salvo mudou", async () => {
    client.setQueryData(["saved-posts"], { items: [], nextCursor: null });
    await render();

    const firstBefore = mocks.renders.get(firstComments) ?? 0;
    const secondBefore = mocks.renders.get(secondComments) ?? 0;
    expect(firstBefore).toBeGreaterThan(0);
    expect(secondBefore).toBeGreaterThan(0);

    await updateSavedFeed([first]);

    expect(mocks.saved.get(firstComments)).toBe(true);
    expect(mocks.saved.get(secondComments)).toBe(false);
    expect(mocks.renders.get(firstComments)).toBeGreaterThan(firstBefore);
    expect(mocks.renders.get(secondComments)).toBe(secondBefore);

    const firstAfter = mocks.renders.get(firstComments);
    await updateSavedFeed([first, second]);

    expect(mocks.saved.get(secondComments)).toBe(true);
    expect(mocks.renders.get(firstComments)).toBe(firstAfter);
    expect(mocks.renders.get(secondComments)).toBeGreaterThan(secondBefore);

    const secondAfter = mocks.renders.get(secondComments);
    await updateSavedFeed([second]);

    expect(mocks.saved.get(firstComments)).toBe(false);
    expect(mocks.renders.get(secondComments)).toBe(secondAfter);
  });

  it("mantém a confirmação local até a coleção pendente chegar", async () => {
    let finishList!: (value: { items: PostView[]; nextCursor: null }) => void;
    mocks.listSaved.mockReturnValue(
      new Promise<{ items: PostView[]; nextCursor: null }>((resolve) => {
        finishList = resolve;
      }),
    );
    mocks.save.mockResolvedValue({
      postId: first.id,
      status: "SAVED",
      counters: first.counters,
    });
    await render();

    await act(async () => {
      await mocks.actions.get(firstComments)!();
    });

    expect(mocks.saved.get(firstComments)).toBe(true);
    expect(client.getQueryData(["saved-posts"])).toBeUndefined();

    await act(async () => {
      finishList({ items: [], nextCursor: null });
    });
    await flush();

    expect(mocks.saved.get(firstComments)).toBe(false);
  });
});
