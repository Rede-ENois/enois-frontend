// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { REACTION_FIGURE_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import type { PostView } from "@/types/application/feed/post-view";
import { ReactionsSummary as ReactionsSummaryView } from "@rede-enois/design-system/domain";
import { ToastProvider } from "@rede-enois/design-system/ui";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useEnoisReactionGlyphs } from "@/lib/reactions/use-enois-reaction-glyphs";
import { resetReactionGuards } from "@/lib/reactions/use-post-reaction";

import { PostActions } from "./post-actions";
import { ReactionsSummary } from "./reactions-summary";

const mocks = vi.hoisted(() => ({
  react: vi.fn(),
  removeReaction: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  reactionsApi: mocks,
}));

vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "viewer" } }),
}));

const initialPost: PostView = {
  id: "post-sync-1",
  authorId: "author-1",
  authorUsername: "autora",
  authorName: "Autora Teste",
  authorAvatar: null,
  type: "INSIGHT",
  content: "Post de teste para sincronização de reações.",
  tags: [],
  mediaIds: [],
  createdAt: "2026-11-18T12:00:00Z",
  visibility: "PUBLIC",
  counters: { reactions: 1, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
  currentUserReaction: null,
  reactionSummary: { FIRE: 1 },
};

function CommunityPostHarness() {
  const { data } = useQuery<{ items: PostView[] }>({
    queryKey: ["community", "comm-1", "feed"],
    queryFn: async () => ({ items: [initialPost] }),
    staleTime: Infinity,
  });
  const post = data?.items[0];
  if (!post) return null;

  return (
    <div>
      <ReactionsSummary post={post} initialSummary={post.reactionSummary} />
      <PostActions post={post} onComments={() => {}} />
    </div>
  );
}

describe("Sincronização entre ReactionsSummary e PostActions", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetReactionGuards();
    usePostCardStore.setState({ cards: {} });
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    mocks.react.mockResolvedValue({
      postId: initialPost.id,
      status: "ACTIVE",
      counters: { ...initialPost.counters, reactions: 2 },
    });
    mocks.removeReaction.mockResolvedValue({
      postId: initialPost.id,
      status: "REMOVED",
      counters: initialPost.counters,
    });

    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["community", "comm-1", "feed"], { items: [initialPost] });

    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    const rootRoute = createRootRoute({ component: Outlet });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: CommunityPostHarness,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();

    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>,
      );
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    usePostCardStore.setState({ cards: {} });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sincroniza o botão de curtir e o contador do rodapé ao clicar na pílula dentro do post", async () => {
    const pillButton = host.querySelector<HTMLButtonElement>('button[aria-label*="Reagir com"]');
    expect(pillButton).not.toBeNull();
    expect(host.querySelector('button[aria-label^="Ver quem reagiu (1"]')).not.toBeNull();

    await act(async () => {
      pillButton?.click();
    });

    expect(mocks.react).toHaveBeenCalledWith(initialPost.id, "FIRE");
    expect(host.querySelector('button[aria-label^="Ver quem reagiu (2"]')).not.toBeNull();
    expect(
      host.querySelector<HTMLButtonElement>('button[aria-pressed="true"][aria-label*="Remover"]'),
    ).not.toBeNull();
  });
});

/** O app liga o leitor de glifo na raiz (`__root`); sem ele nada leva `data-enois-reaction-glyph`. */
function ComLeitorDeGlifo() {
  useEnoisReactionGlyphs();
  return null;
}

describe("Pílula mostra o tipo que ela grava (reação cujo emoji de apoio repete)", () => {
  it("a pílula do ROFL carrega o tipo ROFL, e não o do outro tipo que usa o mesmo emoji", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <ToastProvider>
            <ComLeitorDeGlifo />
            <ReactionsSummaryView
              summary={{ ROFL: 1 }}
              emojis={REACTION_FIGURE_EMOJIS}
              activeType={null}
              clickable
              onToggle={() => {}}
            />
          </ToastProvider>
        </QueryClientProvider>,
      );
    });

    // O CSS pinta o ícone pelo tipo deste atributo: tem que ser o da pílula (ROFL, a estrela), e não
    // o VIBE — o outro tipo que usa ✨ no texto. Quem clica no que vê grava o mesmo tipo.
    const pill = host.querySelector('button[aria-label="Reagir com ✨"]');
    expect(pill).not.toBeNull();
    expect(
      pill?.querySelector("[data-enois-reaction-glyph]")?.getAttribute("data-enois-reaction-glyph"),
    ).toBe("ROFL");
    expect(host.querySelector('[data-enois-reaction-glyph="VIBE"]')).toBeNull();

    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });
});
