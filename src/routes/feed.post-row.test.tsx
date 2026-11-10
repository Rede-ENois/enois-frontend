// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { PostCardProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedPostRow } from "./feed";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Regressão da issue #743: uma publicação nova chegando ao topo do feed empurrava o post em que a
 * pessoa comentava para o índice 1, e os comentários abertos fechavam sozinhos. A causa era o
 * `<FeedPostRow>` só existir no índice 0; nos demais, o `PostCard` ficava sem o wrapper, então o
 * React via um tipo de elemento diferente na mesma posição da árvore e remontava o componente.
 */
const mocks = vi.hoisted(() => ({ cards: new Map<string, PostCardProps>() }));

vi.mock("@/lib/api", () => ({
  communitiesApi: { follow: vi.fn(), unfollow: vi.fn() },
  feedApi: {},
  mediaApi: { get: vi.fn() },
}));
vi.mock("@/lib/api/seals", () => ({
  sealsApi: { forPost: () => Promise.resolve({ seals: [] }) },
}));
vi.mock("@/lib/use-auth", () => ({ useAuth: () => ({ requireAuth: () => true, user: null }) }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/feed/video-autoplay", () => ({ autoplayVideoRef: vi.fn() }));
vi.mock("@/lib/feed-scroll-restoration", () => ({ saveFeedScroll: vi.fn() }));
vi.mock("@/lib/feed/saved-posts", () => ({
  savedPostsQueryOptions: () => ({ queryKey: [], queryFn: vi.fn() }),
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});
vi.mock("@rede-enois/design-system/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/domain")>();
  return {
    ...actual,
    PostCard: (props: PostCardProps) => {
      mocks.cards.set(props.post.id, props);
      return null;
    },
    PostEditDialog: () => null,
    PostPage: () => null,
    PostSealPicker: () => null,
  };
});
vi.mock("./post/media-grid", () => ({ MediaGrid: () => null }));

const makePost = (id: string): PostView => ({
  id,
  authorId: "u1",
  authorUsername: "ana",
  authorName: "Ana",
  authorAvatar: null,
  type: "INSIGHT",
  content: `post ${id}`,
  tags: [],
  mediaIds: [],
  createdAt: "2026-11-03T12:00:00Z",
  visibility: "PUBLIC",
  counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
});

describe("FeedPostRow", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    mocks.cards.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
  });

  it("mantém os comentários abertos quando uma publicação nova empurra o post para o índice 1", async () => {
    const postA = makePost("post_a");
    const postB = makePost("post_b");
    const firstPostRef = vi.fn();

    const renderList = (posts: PostView[]) =>
      act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            {posts.map((post, index) => (
              <FeedPostRow
                key={post.id}
                post={post}
                index={index}
                feedTab="ALL"
                firstPostRef={firstPostRef}
              />
            ))}
          </QueryClientProvider>,
        ),
      );

    // postA chega sozinho no topo (índice 0) e a pessoa abre os comentários.
    await renderList([postA]);
    act(() => {
      (
        mocks.cards.get("post_a")?.actions as unknown as { props: { onComments: () => void } }
      ).props.onComments();
    });
    expect(mocks.cards.get("post_a")?.comments).not.toBeNull();

    // postB chega e empurra postA para o índice 1 — o mesmo `key="post_a"` deveria preservar
    // o estado local do PostCard em vez de remontá-lo.
    await renderList([postB, postA]);

    expect(mocks.cards.get("post_a")?.comments).not.toBeNull();
  });
});
