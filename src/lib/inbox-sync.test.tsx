// @vitest-environment jsdom
import { QueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import type { InboxSyncTestPage } from "@/types/lib/inbox-sync-page";
import type { InboxSyncTestRow } from "@/types/lib/inbox-sync-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshConversation, resyncInbox } from "./inbox-sync.js";

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
});
