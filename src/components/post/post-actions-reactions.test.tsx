// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { REACTION_PICKER_EMOJIS } from "@/constants/reaction-emojis";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import { ToastProvider } from "@rede-enois/design-system/ui";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostActions } from "./post-actions";

const post: PostView = {
  id: "post_reaction_summary_fixture",
  authorId: "user_synthetic",
  authorUsername: "pessoa_ficticia",
  authorName: "Pessoa Fictícia",
  authorAvatar: null,
  type: "INSIGHT",
  content: "Publicação sintética para verificar as reações.",
  tags: [],
  mediaIds: [],
  createdAt: "2026-11-01T12:00:00Z",
  visibility: "PUBLIC",
  counters: { reactions: 1, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
  reactionSummary: { FIRE: 1 },
};

function makeRouter(post: PostView) {
  const rootRoute = createRootRoute({ component: Outlet });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <PostActions post={post} onComments={() => {}} />,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

describe("PostActions: reações reais da publicação", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const network = vi.fn(() => Promise.reject(new Error("Rede desativada neste teste local")));

  beforeEach(() => {
    network.mockClear();
    vi.stubGlobal("fetch", network);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    // jsdom não implementa a rolagem que o roteador real solicita ao montar a página.
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const render = async (value: PostView) => {
    const router = makeRouter(value);
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

    // O card não pede nada além de "esta sessão é admin?" — que decide se a remoção administrativa
    // é montada. Qualquer outra chamada do card continua sendo um erro.
    const calls = network.mock.calls as unknown as string[][];
    const urls = calls.map((call) => String(call[0]));
    expect(urls.filter((url) => !url.includes("/moderation/me"))).toEqual([]);
  };

  const reactionButton = () => host.querySelector('button[aria-label^="Ver quem reagiu ("]');
  // O resumo desenha a figura do próprio tipo (`REACTION_PICKER_EMOJIS`), não o emoji de apoio:
  // FIRE desenha o termômetro e CLAP o pirata.
  const reactionEmojis = () =>
    Array.from(reactionButton()?.querySelectorAll("span") ?? [], (item) => item.textContent);
  const figura = (type: ReactionType) => REACTION_PICKER_EMOJIS[type];

  it("mostra só fogo quando essa é a única reação que o post recebeu", async () => {
    await render(post);

    expect(reactionEmojis()).toEqual([figura("FIRE")]);
  });

  it("mostra até três tipos reais, do mais usado para o menos usado", async () => {
    await render({ ...post, reactionSummary: { LIKE: 1, LOVE: 2, CLAP: 3, FIRE: 4 } });

    expect(reactionEmojis()).toEqual([figura("FIRE"), figura("CLAP"), figura("LOVE")]);
  });

  it.each([undefined, null])("preserva os emojis padrão quando o resumo é %s", async (summary) => {
    await render({ ...post, reactionSummary: summary });

    expect(reactionEmojis()).toEqual([figura("LIKE"), figura("LOVE"), figura("INSIGHTFUL")]);
  });

  it("não mostra reações quando o resumo está vazio, mesmo com contador antigo", async () => {
    await render({ ...post, reactionSummary: {} });

    expect(reactionButton()).toBeNull();
  });

  it("não mostra reações quando não há resumo nem reações contadas", async () => {
    await render({
      ...post,
      reactionSummary: undefined,
      counters: { ...post.counters, reactions: 0 },
    });

    expect(reactionButton()).toBeNull();
  });
});
