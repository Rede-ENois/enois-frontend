// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  byUsername: vi.fn(),
  saveFeedScroll: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  portfolioApi: { byUsername: mocks.byUsername },
}));
vi.mock("@/lib/feed-scroll-restoration", () => ({ saveFeedScroll: mocks.saveFeedScroll }));

const { PortfolioPointer } = await import("./portfolio-pointer");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const post = {
  id: "post-vitrine",
  type: "PORTFOLIO",
  content: "Minha vitrine está no ar.",
  authorId: "u2",
  authorName: "Ana",
  authorUsername: "ana",
  authorAvatar: null,
  createdAt: "2026-11-24T10:00:00Z",
  tags: [],
  mediaIds: [],
} as unknown as PostView;

describe("vitrine no card do feed", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async (feedTab?: "FOR_YOU") => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <PortfolioPointer post={post} feedTab={feedTab} />
        </QueryClientProvider>,
      );
    });
    await settle();
  };

  beforeEach(() => {
    mocks.byUsername.mockReset();
    mocks.saveFeedScroll.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("publicada: mostra o título e a primeira frase lidos como visita e abre a vitrine", async () => {
    mocks.byUsername.mockResolvedValue({
      username: "ana",
      version: 2,
      html: "<h1>Ana Souza</h1><p>Desenho e construo interfaces.</p>",
      publishedAt: "2026-11-20",
      blocks: [],
    });
    await render("FOR_YOU");

    expect(mocks.byUsername).toHaveBeenCalledWith("ana");
    expect(host.textContent).toContain("Ana Souza");
    expect(host.textContent).toContain("Desenho e construo interfaces.");

    const link = host.querySelector('a[href="/portfolio/ana"]') as HTMLAnchorElement;
    act(() => link.click());
    expect(mocks.saveFeedScroll).toHaveBeenCalledWith({
      tab: "FOR_YOU",
      postId: "post-vitrine",
      scrollY: window.scrollY,
    });
  });

  it("sem publicação (404): o card fica sem o resumo, sem erro", async () => {
    mocks.byUsername.mockRejectedValue(new ApiError(404, "PORTFOLIO_NOT_FOUND", "não encontrado"));
    await render("FOR_YOU");

    expect(host.textContent).toBe("");
  });

  it("fora do feed, abrir a vitrine não guarda rolagem", async () => {
    mocks.byUsername.mockResolvedValue({
      username: "ana",
      version: 2,
      html: "<p>Só a frase.</p>",
      publishedAt: "2026-11-20",
      blocks: [],
    });
    await render();

    const link = host.querySelector('a[href="/portfolio/ana"]') as HTMLAnchorElement;
    act(() => link.click());
    expect(mocks.saveFeedScroll).not.toHaveBeenCalled();
  });
});
