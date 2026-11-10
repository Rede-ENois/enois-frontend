// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostActions } from "./post-actions";

const navigate = vi.fn();
const toast = vi.fn();
const clipboard = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));
vi.mock("@rede-enois/design-system/ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@rede-enois/design-system/ui");
  return {
    ...actual,
    useToast: () => ({ toast }),
  };
});
vi.mock("@/lib/api", () => ({
  REACTION_EMOJIS: [],
  reactionsApi: {
    share: () =>
      Promise.resolve({ counters: { reactions: 0, comments: 0, saves: 0, shares: 1, reposts: 0 } }),
  },
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "u1" } }),
}));
vi.mock("@/lib/feed/saved-posts", () => ({
  savedPostsQueryOptions: () => ({ queryKey: ["saved"], queryFn: () => ({ items: [] }) }),
  savedStateFromAction: () => false,
  syncSavedPostsCache: () => {},
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
  usePostCardStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      cards: {},
      initializePostCard: () => {},
      disposePostCard: () => {},
      setShowReactions: () => {},
      setShowReport: () => {},
    }),
}));

const post = {
  id: "post_1",
  authorId: "u2",
  authorName: "Ana",
  authorUsername: "ana",
  content: "teste",
  type: "INSIGHT" as const,
  tags: [],
  mediaIds: [],
  createdAt: "2026-11-09T00:00:00Z",
  visibility: "PUBLIC" as const,
  counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE" as const,
};

describe("PostActions share menu", () => {
  let root: Root;
  let host: HTMLDivElement;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  beforeEach(() => {
    navigate.mockReset();
    toast.mockReset();
    clipboard.mockReset();
    // jsdom nao tem matchMedia; mocka como mobile pra abrir Sheet
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("max-width"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }),
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("clipboard falha no enviar via chat mostra erro e nao navega", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <PostActions post={post as never} onComments={() => {}} />
        </QueryClientProvider>,
      );
    });

    // Abre o menu de compartilhamento
    const shareButton = host.querySelector('[aria-label="Compartilhar"]') as HTMLButtonElement;
    expect(shareButton, "botao compartilhar nao encontrado").toBeTruthy();
    await act(async () => shareButton.click());

    // Sheet renderiza num portal no body
    const chatButton = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Enviar via chat"),
    );
    expect(chatButton, "botao enviar via chat nao encontrado").toBeTruthy();
    await act(async () => chatButton!.click());

    // Toast de erro, sem navegacao
    expect(toast).toHaveBeenCalledWith("Não foi possível copiar o link.", "error");
    expect(navigate).not.toHaveBeenCalled();
  });
});
