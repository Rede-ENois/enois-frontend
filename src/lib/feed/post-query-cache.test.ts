import { QueryClient, QueryObserver, type QueryObserverOptions } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedPages } from "@/types/lib/feed/feed-pages";
import { describe, expect, it, vi } from "vitest";

import {
  feedQueryKey,
  feedRefreshOptions,
  isUnseenFeedQuery,
  refreshFeedFirstPage,
  removePostFromFeedCache,
  updatePostInQueryCache,
} from "./post-query-cache";

const post = (id: string, reactions = 0): PostView =>
  ({ id, counters: { reactions, comments: 0, saves: 0, shares: 0 } }) as PostView;

const page = (ids: string[], nextCursor: string | null = null) => ({
  items: ids.map((id) => post(id)),
  nextCursor,
});

/**
 * O prefixo `["feed"]` alcança consultas vizinhas que guardam LISTA (ex.: `["feed","scheduled"]`).
 * Antes, atualizar a reação estourava `pages.map` nelas e a ação morria antes do servidor.
 */
describe("updatePostInQueryCache", () => {
  it("não quebra quando existe consulta vizinha com lista no prefixo feed", () => {
    const client = new QueryClient();
    client.setQueryData(["feed", "scheduled"], []);
    client.setQueryData(["feed", { tab: "FOR_YOU" }], {
      pages: [{ items: [post("p1")], nextCursor: null }],
      pageParams: [null],
    });

    expect(() =>
      updatePostInQueryCache(client, "p1", (current) => ({
        ...current,
        counters: { ...current.counters, reactions: 1 },
      })),
    ).not.toThrow();

    const feed = client.getQueryData<{
      pages: { items: PostView[] }[];
    }>(["feed", { tab: "FOR_YOU" }]);
    expect(feed?.pages[0].items[0].counters.reactions).toBe(1);
    expect(client.getQueryData(["feed", "scheduled"])).toEqual([]);
  });

  it("atualiza a cópia isolada do post quando existe", () => {
    const client = new QueryClient();
    client.setQueryData(["post", "p2"], post("p2", 3));
    updatePostInQueryCache(client, "p2", (current) => ({
      ...current,
      counters: { ...current.counters, reactions: 9 },
    }));
    expect((client.getQueryData(["post", "p2"]) as PostView).counters.reactions).toBe(9);
  });
});

describe("renovação automática do feed", () => {
  it("nenhuma aba se renova pelo react-query", () => {
    // Antes: `refetchInterval` de 30s e `refetchOnWindowFocus` em toda aba refaziam a consulta
    // inteira — todas as páginas carregadas — e reescreviam o topo embaixo de quem lia.
    for (const tab of ["ALL", "FOR_YOU", "UNSEEN", "TRENDING", "CORPORATE"]) {
      expect(feedRefreshOptions(tab)).toEqual({
        refetchInterval: false,
        refetchOnWindowFocus: false,
      });
    }
  });

  it("reconhece a chave que o useFeed monta", () => {
    expect(isUnseenFeedQuery(["feed", "UNSEEN", "", ""])).toBe(true);
    expect(isUnseenFeedQuery(["feed", "ALL", "", ""])).toBe(false);
    expect(isUnseenFeedQuery(["post", "UNSEEN"])).toBe(false);
  });
});

describe("feedQueryKey", () => {
  it.each([
    ["all", undefined, ""],
    ["open", false, false],
    ["resolved", true, true],
  ] as const)("usa o valor canônico de resolved para %s", (_status, resolved, expected) => {
    expect(feedQueryKey("ALL", "QUESTION", resolved)).toEqual([
      "feed",
      "ALL",
      "QUESTION",
      expected,
    ]);
  });

  it("normaliza filtros ausentes e mantém as abas separadas", () => {
    expect(feedQueryKey("ALL")).toEqual(["feed", "ALL", "", ""]);
    expect(feedQueryKey("ALL", "")).toEqual(feedQueryKey("ALL"));
    expect(feedQueryKey("CORPORATE")).toEqual(["feed", "CORPORATE", "", ""]);
    expect(feedQueryKey("ALL", "QUESTION", false)).not.toEqual(feedQueryKey("ALL", "QUESTION"));
    expect(feedQueryKey("ALL", "QUESTION", false)).not.toEqual(
      feedQueryKey("ALL", "QUESTION", true),
    );
  });
});

describe("refreshFeedFirstPage", () => {
  it("põe o post novo no topo sem refazer as páginas já carregadas", async () => {
    const client = new QueryClient();
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce(page(["novo", "p1"], "cursor-1"))
      .mockResolvedValueOnce(page(["p1"], "cursor-1"));
    // A renovação só age em consulta que está na tela: o observer é o que a tela monta. Ele fica
    // desligado para não buscar sozinho — o cache é montado à mão, como depois de rolar a lista.
    // `initialPageParam` mora nas opções da consulta infinita; o observer genérico não o declara.
    const observer = new QueryObserver(client, {
      queryKey: ["feed", "ALL", "", ""],
      queryFn,
      initialPageParam: null,
      enabled: false,
    } as QueryObserverOptions & { initialPageParam: null });
    const unsubscribe = observer.subscribe(() => {});
    client.setQueryData(["feed", "ALL", "", ""], {
      pages: [page(["p1"], "cursor-1"), page(["p2"], null)],
      pageParams: [null, "cursor-1"],
    });

    await refreshFeedFirstPage(client);
    unsubscribe();

    const data = client.getQueryData<{ pages: { items: PostView[] }[] }>(["feed", "ALL", "", ""]);
    expect(data?.pages[0].items.map((item) => item.id)).toEqual(["novo", "p1"]);
    // A segunda página continua exatamente como estava: nada foi refeito.
    expect(data?.pages[1].items.map((item) => item.id)).toEqual(["p2"]);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("não busca consulta que não está na tela", async () => {
    const client = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue(page(["novo"]));
    client.setQueryData(["feed", "ALL", "", ""], {
      pages: [page(["p1"])],
      pageParams: [null],
    });
    const query = client.getQueryCache().find({ queryKey: ["feed", "ALL", "", ""], exact: true });
    if (query) query.setOptions({ ...query.options, queryFn });

    await refreshFeedFirstPage(client);

    expect(queryFn).not.toHaveBeenCalled();
  });

  it("aplica campos novos com os mesmos ids e preserva referências quando nada muda", async () => {
    const client = new QueryClient();
    const key = ["feed", "ALL", "", ""] as const;
    const queryFn = vi.fn().mockImplementation(async () => ({
      items: [{ ...post("p1", 7), content: "texto editado" }],
      nextCursor: "cursor-1",
    }));
    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn,
      initialPageParam: null,
      enabled: false,
    } as QueryObserverOptions & { initialPageParam: null });
    const unsubscribe = observer.subscribe(() => {});
    client.setQueryData<FeedPages>(key, {
      pages: [page(["p1"], "cursor-1"), page(["p2"])],
      pageParams: [null, "cursor-1"],
    });
    const before = client.getQueryData<FeedPages>(key)!;

    try {
      await refreshFeedFirstPage(client);

      const updated = client.getQueryData<FeedPages>(key)!;
      expect(updated.pages[0].items).toEqual([{ ...post("p1", 7), content: "texto editado" }]);
      expect(updated.pages[1]).toBe(before.pages[1]);
      expect(updated.pageParams).toBe(before.pageParams);

      await refreshFeedFirstPage(client);

      expect(client.getQueryData(key)).toBe(updated);
      expect(queryFn).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
      client.clear();
    }
  });
});

describe("removePostFromFeedCache", () => {
  it("tira o post de todas as páginas carregadas sem pedir nada ao servidor", () => {
    const client = new QueryClient();
    client.setQueryData(["feed", "ALL", "", ""], {
      pages: [page(["p1", "p2"]), page(["p3"])],
      pageParams: [null, "c1"],
    });

    removePostFromFeedCache(client, "p2");

    const data = client.getQueryData<{ pages: { items: PostView[] }[] }>(["feed", "ALL", "", ""]);
    expect(data?.pages[0].items.map((item) => item.id)).toEqual(["p1"]);
    expect(data?.pages[1].items.map((item) => item.id)).toEqual(["p3"]);
  });

  it("desfazer recoloca o post na posição original sem perder outras alterações", () => {
    const client = new QueryClient();
    const key = ["feed", "ALL", "", ""];
    const original: FeedPages = {
      pages: [page(["p1"], "c1"), page(["p2", "p3", "p4"])],
      pageParams: [null, "c1"],
    };
    client.setQueryData(key, original);
    client.setQueryData(["post", "p3"], post("p3"));

    try {
      const restore = removePostFromFeedCache(client, "p3");
      updatePostInQueryCache(client, "p4", () => post("p4", 4));
      const restored = post("p3", 7);

      restore(restored);
      restore(restored);

      expect(client.getQueryData(key)).toEqual({
        ...original,
        pages: [
          original.pages[0],
          { ...original.pages[1], items: [post("p2"), restored, post("p4", 4)] },
        ],
      });
      expect(client.getQueryData(["post", "p3"])).toEqual(restored);
    } finally {
      client.clear();
    }
  });

  it("ignora cursores descartados e consultas removidas, sem alterar listas vizinhas", () => {
    const client = new QueryClient();
    const key = ["feed", "ALL", "", ""];
    client.setQueryData<FeedPages>(key, {
      pages: [page(["p1"], "c1"), page(["p2"])],
      pageParams: [null, "c1"],
    });
    client.setQueryData(["feed", "scheduled"], []);

    try {
      const restore = removePostFromFeedCache(client, "p2");
      const current: FeedPages = {
        pages: [page(["p1"], "c2"), page(["p3"])],
        pageParams: [null, "c2"],
      };
      client.setQueryData(key, current);

      restore(post("p2"));
      expect(client.getQueryData(key)).toEqual(current);
      expect(client.getQueryData(["feed", "scheduled"])).toEqual([]);

      client.removeQueries({ queryKey: key, exact: true });
      restore(post("p2"));
      expect(client.getQueryData(key)).toBeUndefined();
    } finally {
      client.clear();
    }
  });
});
