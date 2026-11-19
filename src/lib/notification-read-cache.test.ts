import { QueryClient } from "@tanstack/react-query";

import type { Notification } from "@/types/application/notification/notification";
import { describe, expect, it } from "vitest";

import { markReadInCache } from "./notification-read-cache";

const notification = (id: string): Notification =>
  ({ id, kind: "NEW_REACTION", read: false }) as Notification;

describe("markReadInCache", () => {
  it("dims the opened notification in the bell list and in the full page at once", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "SOCIAL"], {
      items: [notification("a"), notification("b")],
      nextCursor: null,
    });
    client.setQueryData(["notifications", "page", "SOCIAL"], {
      pages: [{ items: [notification("a")], nextCursor: null }],
      pageParams: [null],
    });
    client.setQueryData(["notifications", "summary", "SOCIAL"], { total: 2, byModule: {} });

    markReadInCache(client, "a");

    const bell = client.getQueryData<{ items: Notification[] }>(["notifications", "SOCIAL"]);
    const page = client.getQueryData<{ pages: { items: Notification[] }[] }>([
      "notifications",
      "page",
      "SOCIAL",
    ]);
    expect(bell?.items.map((item) => item.read)).toEqual([true, false]);
    expect(page?.pages[0].items[0].read).toBe(true);
    expect(client.getQueryData(["notifications", "summary", "SOCIAL"])).toEqual({
      total: 2,
      byModule: {},
    });
  });

  it("marks everything for read-all", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "SOCIAL"], {
      items: [notification("a"), notification("b")],
      nextCursor: null,
    });

    markReadInCache(client, "all");

    const bell = client.getQueryData<{ items: Notification[] }>(["notifications", "SOCIAL"]);
    expect(bell?.items.every((item) => item.read)).toBe(true);
  });

  /**
   * O contador do sino e do menu vem do RESUMO (byModule), não das linhas: "limpar" zerava as
   * linhas e deixava o contador no ar até alguma outra invalidação — o relato do bug. Ler tudo
   * zera o resumo na hora; ler UMA linha não o mexe (a contagem das outras continua).
   */
  it("zerar tudo zera o resumo do contador; ler uma não o mexe", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "SOCIAL"], {
      items: [notification("a"), notification("b")],
      nextCursor: null,
    });
    client.setQueryData(["notifications", "summary", "SOCIAL"], {
      total: 2,
      byModule: { NEW_REACTION: 1, MENTION: 1 },
    });

    markReadInCache(client, "all");

    const summary = client.getQueryData<{ total: number; byModule: Record<string, number> }>([
      "notifications",
      "summary",
      "SOCIAL",
    ]);
    expect(summary?.total).toBe(0);
    expect(summary?.byModule).toEqual({});

    // Ler UMA linha: o resumo fica como está (as outras contagens continuam valendo) —
    // o refetch do servidor resolve o valor exato logo depois.
    client.setQueryData(["notifications", "summary", "SOCIAL"], {
      total: 2,
      byModule: { NEW_REACTION: 1, MENTION: 1 },
    });
    markReadInCache(client, "a");
    expect(
      client.getQueryData<{ total: number; byModule: Record<string, number> }>([
        "notifications",
        "summary",
        "SOCIAL",
      ]),
    ).toEqual({ total: 2, byModule: { NEW_REACTION: 1, MENTION: 1 } });
  });

  /** Um "ler tudo" que falha restaura o resumo anterior junto das linhas. */
  it("a reversão restaura o resumo anterior", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "SOCIAL"], {
      items: [notification("a")],
      nextCursor: null,
    });
    const summaryAnterior = { total: 1, byModule: { NEW_REACTION: 1 } };
    client.setQueryData(["notifications", "summary", "SOCIAL"], summaryAnterior);

    const rollback = markReadInCache(client, "all");
    expect(client.getQueryData(["notifications", "summary", "SOCIAL"])).toEqual({
      total: 0,
      byModule: {},
    });

    rollback();
    expect(client.getQueryData(["notifications", "summary", "SOCIAL"])).toEqual(summaryAnterior);
  });

  it("restaura só a leitura afetada sem perder conteúdo, cursores ou linhas novas", () => {
    const client = new QueryClient();
    const key = ["notifications", "page", "SOCIAL"];
    client.setQueryData(key, {
      pages: [
        { items: [notification("a")], nextCursor: "older" },
        { items: [notification("b")], nextCursor: null },
      ],
      pageParams: [null, "older"],
    });

    const rollback = markReadInCache(client, "b");

    client.setQueryData(key, {
      pages: [
        { items: [{ ...notification("a"), read: true }], nextCursor: "older" },
        {
          items: [
            { ...notification("b"), read: true, body: "Conteúdo atualizado" },
            notification("c"),
          ],
          nextCursor: "next",
        },
      ],
      pageParams: [null, "older"],
    });
    rollback?.();

    expect(client.getQueryData(key)).toMatchObject({
      pages: [
        { items: [{ id: "a", read: true }], nextCursor: "older" },
        {
          items: [
            { id: "b", read: false, body: "Conteúdo atualizado" },
            { id: "c", read: false },
          ],
          nextCursor: "next",
        },
      ],
      pageParams: [null, "older"],
    });
    client.clear();
  });
});
