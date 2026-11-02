import { QueryClient } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";
import type { ActionResponse } from "@/types/application/reaction/action-response";
import { describe, expect, it } from "vitest";

import { applySaveToSavedFeed, savedPostsQueryOptions, syncSavedPostsCache } from "./saved-posts";

function post(id: string, saves: number): PostView {
  return {
    id,
    authorId: "author",
    authorUsername: "ana",
    authorName: "Ana",
    authorAvatar: null,
    type: "INSIGHT",
    content: "",
    tags: [],
    mediaIds: [],
    createdAt: "2026-10-23T00:00:00Z",
    visibility: "PUBLIC",
    counters: { reactions: 1, comments: 2, saves, shares: 3, reposts: 0 },
    status: "ACTIVE",
  };
}

function page(items: PostView[]): PageResponse<PostView> {
  return { items, nextCursor: null };
}

function action(postId: string, status: string, saves: number): ActionResponse {
  return {
    postId,
    status,
    counters: { reactions: 1, comments: 2, saves, shares: 3, reposts: 0 },
  };
}

describe("applySaveToSavedFeed", () => {
  it("coloca um post recém-salvo no início e usa o contador do servidor", () => {
    const current = page([post("older", 4)]);
    const saved = post("new", 0);

    const next = applySaveToSavedFeed(current, saved, action("new", "SAVED", 1));

    expect(next?.items.map((item) => item.id)).toEqual(["new", "older"]);
    expect(next?.items[0]?.counters.saves).toBe(1);
    expect(current.items.map((item) => item.id)).toEqual(["older"]);
  });

  it("não duplica um post que já estava salvo e atualiza o contador no lugar", () => {
    const current = page([post("first", 2), post("target", 1)]);

    const next = applySaveToSavedFeed(
      current,
      post("target", 0),
      action("target", "ALREADY_SAVED", 4),
    );

    expect(next?.items.map((item) => item.id)).toEqual(["first", "target"]);
    expect(next?.items[1]?.counters.saves).toBe(4);
    expect(current.items[1]?.counters.saves).toBe(1);
  });

  it("não duplica quando o save confirma um post que o cache já listava", () => {
    const current = page([post("target", 2), post("older", 1)]);

    const next = applySaveToSavedFeed(current, post("target", 0), action("target", "SAVED", 3));

    expect(next?.items.map((item) => item.id)).toEqual(["target", "older"]);
    expect(next?.items[0]?.counters.saves).toBe(3);
  });

  it("inclui um post que o servidor já considerava salvo e o cache não tinha", () => {
    const current = page([post("older", 1)]);

    const next = applySaveToSavedFeed(
      current,
      post("missing", 0),
      action("missing", "ALREADY_SAVED", 2),
    );

    expect(next?.items.map((item) => item.id)).toEqual(["missing", "older"]);
    expect(next?.items[0]?.counters.saves).toBe(2);
  });

  it("tira o post da lista ao remover o save", () => {
    const current = page([post("keep", 1), post("gone", 4), post("tail", 1)]);

    const next = applySaveToSavedFeed(current, post("gone", 4), action("gone", "SAVE_REMOVED", 3));

    expect(next?.items.map((item) => item.id)).toEqual(["keep", "tail"]);
  });

  it("tira o post mesmo quando o servidor diz que o save já não existia", () => {
    const current = page([post("ghost", 1)]);

    const next = applySaveToSavedFeed(
      current,
      post("ghost", 1),
      action("ghost", "SAVE_NOT_FOUND", 1),
    );

    expect(next?.items).toEqual([]);
  });

  it("não inventa uma coleção quando a consulta ainda não foi carregada", () => {
    expect(
      applySaveToSavedFeed(undefined, post("new", 0), action("new", "SAVED", 1)),
    ).toBeUndefined();
  });

  it("ignora um status que não é de save", () => {
    const current = page([post("keep", 1)]);

    expect(applySaveToSavedFeed(current, post("other", 0), action("other", "SHARED", 9))).toBe(
      current,
    );
  });
});

describe("syncSavedPostsCache", () => {
  it("atualiza a consulta compartilhada que a tela de salvos lê", () => {
    const client = new QueryClient();
    const key = savedPostsQueryOptions().queryKey;
    client.setQueryData(key, page([post("older", 1)]));

    syncSavedPostsCache(client, post("new", 0), action("new", "SAVED", 1));

    expect(client.getQueryData(key)?.items.map((item) => item.id)).toEqual(["new", "older"]);
  });

  it("não cria cache parcial quando ninguém carregou os salvos ainda", () => {
    const client = new QueryClient();

    syncSavedPostsCache(client, post("new", 0), action("new", "SAVED", 1));

    expect(client.getQueryData(savedPostsQueryOptions().queryKey)).toBeUndefined();
  });
});
