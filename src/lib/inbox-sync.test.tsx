// @vitest-environment jsdom
import { QueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import type { InboxSyncTestPage } from "@/types/lib/inbox-sync-page";
import type { InboxSyncTestRow } from "@/types/lib/inbox-sync-test";
import type { PositionNotice } from "@/types/lib/position-notice";
import type { PositionNoticePage } from "@/types/lib/position-notice-page";
import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshConversation, refreshNotifications, resyncInbox } from "./inbox-sync.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => vi.restoreAllMocks());

/**
 * Sobe uma consulta paginada real no cache com um observador plantado (o sync só renova consulta
 * com observador — regra do módulo) e a queryFn gravada nas opções, como o React Query faz na tela.
 */
function screenWithConversation(
  key: readonly unknown[],
  firstPage: InboxSyncTestPage,
  fresh: InboxSyncTestPage,
) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(key, { pages: [firstPage], pageParams: [null] });
  const cache = queryClient.getQueryCache();
  const query = cache.find({ queryKey: key })!;
  // O formato da tela: infinita por cursor, com queryFn e observador contando.
  (query.options as { initialPageParam?: unknown }).initialPageParam = null;
  query.options.queryFn = async () => fresh;
  vi.spyOn(query, "getObserversCount").mockReturnValue(1);
  return { queryClient, key };
}

function firstItems(queryClient: QueryClient, key: readonly unknown[]): InboxSyncTestRow[] {
  return queryClient.getQueryData<InfiniteData<InboxSyncTestPage, string | null>>(key)!.pages[0]
    .items;
}

describe("sincronia da caixa de entrada", () => {
  it("atualiza os campos da conversa mesmo quando a resposta traz os mesmos ids", async () => {
    const { queryClient, key } = screenWithConversation(
      ["conversations", { context: "social" }],
      {
        items: [
          { id: "c1", preview: "texto antigo", unread: 3 },
          { id: "c2", preview: "outra antiga", unread: 0 },
        ],
      },
      {
        items: [
          { id: "c1", preview: "texto editado", unread: 0 },
          { id: "c2", preview: "outra antiga", unread: 0 },
        ],
      },
    );

    await refreshConversation(queryClient, "c1");

    const items = firstItems(queryClient, key);
    expect(items.find((row) => row.id === "c1")).toEqual({
      id: "c1",
      preview: "texto editado",
      unread: 0,
    });
    expect(items).toHaveLength(2);
  });

  it("reconexão também atualiza campos com a mesma composição de ids", async () => {
    const { queryClient, key } = screenWithConversation(
      ["conversations"],
      { items: [{ id: "n1", preview: "a", unread: 1 }] },
      { items: [{ id: "n1", preview: "a", unread: 0 }] },
    );

    await resyncInbox(queryClient);

    expect(firstItems(queryClient, key)[0]).toEqual({ id: "n1", preview: "a", unread: 0 });
  });

  describe("lista de avisos paginada por posição", () => {
    /**
     * Servidor de `unreadFirst=true` em miniatura: não lidos primeiro, depois os lidos, duas linhas
     * por página e o cursor `o:<n>` sendo a posição na ordem. Ler um aviso o leva para o fim.
     */
    function positionServer(ids: string[]) {
      const rows: PositionNotice[] = ids.map((id) => ({ id, read: false }));
      const calls: (string | null)[] = [];
      return {
        calls,
        read(id: string) {
          const index = rows.findIndex((row) => row.id === id);
          const [row] = rows.splice(index, 1);
          rows.push({ ...row, read: true });
        },
        async page(cursor: string | null): Promise<PositionNoticePage> {
          calls.push(cursor);
          const offset = cursor ? Number(cursor.slice(2)) : 0;
          const end = offset + 2;
          return {
            items: rows.slice(offset, end),
            nextCursor: end < rows.length ? `o:${end}` : null,
          };
        },
      };
    }

    async function screenWithNotices(
      server: ReturnType<typeof positionServer>,
      pages: number,
      meta?: Record<string, unknown>,
    ) {
      const queryClient = new QueryClient();
      const key = ["notifications", "SOCIAL", "unread-first"];
      await queryClient.fetchInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => server.page(pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (last: PositionNoticePage) => last.nextCursor ?? undefined,
        pages,
        meta,
      });
      vi.spyOn(
        queryClient.getQueryCache().find({ queryKey: key })!,
        "getObserversCount",
      ).mockReturnValue(1);
      server.calls.length = 0;
      const cachedIds = () =>
        queryClient
          .getQueryData<InfiniteData<PositionNoticePage, string | null>>(key)!
          .pages.flatMap((page) => page.items.map((item) => item.id));
      return { queryClient, cachedIds };
    }

    it("ler um aviso não faz o não lido seguinte sumir do que já foi carregado", async () => {
      // A, B, C, D carregados em duas páginas; E viria em `o:4`. Ler A empurra todo mundo uma
      // posição: E passa a ocupar a posição 3, que já tinha sido carregada. Renovando só a
      // primeira página, o cursor guardado (`o:4`) pula E e ele nunca aparece em "Novas".
      const server = positionServer(["A", "B", "C", "D", "E"]);
      const { queryClient, cachedIds } = await screenWithNotices(server, 2, {
        positionCursor: true,
      });

      server.read("A");
      await refreshNotifications(queryClient);

      expect(cachedIds()).toContain("E");
    });

    it("falha de rede na renovação da lista por posição mantém o que já estava carregado", async () => {
      const server = positionServer(["A", "B", "C", "D", "E"]);
      const { queryClient, cachedIds } = await screenWithNotices(server, 2, {
        positionCursor: true,
      });
      vi.spyOn(server, "page").mockRejectedValue(new Error("offline"));

      await expect(refreshNotifications(queryClient)).resolves.toBeDefined();

      expect(cachedIds()).toEqual(["A", "B", "C", "D"]);
    });

    it("com uma página só, a lista por posição renova só a primeira página", async () => {
      const server = positionServer(["A", "B", "C"]);
      const { queryClient } = await screenWithNotices(server, 1, { positionCursor: true });

      server.read("A");
      await refreshNotifications(queryClient);

      expect(server.calls).toEqual([null]);
    });

    it("lista sem cursor de posição continua renovando só a primeira página", async () => {
      const server = positionServer(["A", "B", "C", "D", "E"]);
      const { queryClient } = await screenWithNotices(server, 2);

      await resyncInbox(queryClient);

      expect(server.calls).toEqual([null]);
    });
  });
});
