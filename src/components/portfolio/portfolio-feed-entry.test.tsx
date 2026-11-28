// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  byUsername: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  profileApi: { me: mocks.me },
  portfolioApi: { byUsername: mocks.byUsername },
}));

const { PortfolioFeedEntry } = await import("./portfolio-feed-entry");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const profile = { id: "u1", username: "ana", name: "Ana Souza", avatar: null };

describe("entrada da vitrine no feed", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <PortfolioFeedEntry />
        </QueryClientProvider>,
      );
    });
    await settle();
  };

  beforeEach(() => {
    mocks.me.mockReset();
    mocks.byUsername.mockReset();
    mocks.me.mockResolvedValue(profile);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("publicada: mostra a própria vitrine com o atalho de abrir", async () => {
    mocks.byUsername.mockResolvedValue({
      username: "ana",
      version: 1,
      html: "<p>Desenho e construo interfaces.</p>",
      publishedAt: "2026-11-20",
      blocks: [],
    });
    await render();

    expect(host.textContent).toContain("Desenho e construo interfaces.");
    expect(host.querySelector('a[href="/portfolio/ana"]')).not.toBeNull();
    expect(host.querySelector('a[href="/portfolio/editar"]')).toBeNull();
  });

  it("404 da própria vitrine vira o convite para o editor", async () => {
    mocks.byUsername.mockRejectedValue(new ApiError(404, "PORTFOLIO_NOT_FOUND", "não encontrado"));
    await render();

    expect(host.textContent).toContain("Editar minha vitrine");
    expect(host.querySelector('a[href="/portfolio/editar"]')).not.toBeNull();
  });

  it("servidor instável: a entrada sai de cena em vez de virar convite", async () => {
    mocks.byUsername.mockRejectedValue(new ApiError(503, undefined, "indisponível"));
    await render();

    expect(host.textContent).toBe("");
  });
});
