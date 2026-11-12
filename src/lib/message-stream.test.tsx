// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider, type QueryOptions } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleConversationChanged,
  handleNotificationCreated,
  useInboxPollInterval,
  useMessageStream,
} from "./message-stream";

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  private listeners = new Map<string, (event: MessageEvent<string>) => void>();

  constructor(
    readonly url: string,
    readonly init?: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, listener);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(type: string, data: string) {
    this.listeners.get(type)?.({ data } as MessageEvent<string>);
  }
}

const page = (ids: string[], nextCursor: string | null = null) => ({
  items: ids.map((id) => ({ id })),
  nextCursor,
});

/**
 * Monta no cache uma consulta infinita com duas páginas carregadas, como depois de rolar a lista,
 * e devolve a função que o servidor chamaria. A consulta fica na tela (observer ativo) porque é
 * só isso que a sincronia atualiza.
 */
function seedInfinite(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  pages: { items: { id: string }[]; nextCursor: string | null }[],
  fresh: { items: { id: string }[]; nextCursor: string | null },
) {
  const queryFn = vi.fn().mockResolvedValue(fresh);
  // `initialPageParam` é da consulta infinita; o cache genérico não o declara no tipo.
  const infinite = { queryKey, queryFn, initialPageParam: null } as unknown as QueryOptions & {
    queryKey: readonly unknown[];
  };
  const query = queryClient.getQueryCache().build(queryClient, infinite);
  query.setOptions({ ...query.options, queryFn, initialPageParam: null } as typeof query.options);
  query.setData({ pages, pageParams: pages.map((_, index) => (index === 0 ? null : `c${index}`)) });
  // `getObserversCount` é o que separa "está na tela" de "ficou no cache".
  vi.spyOn(query, "getObserversCount").mockReturnValue(1);
  return queryFn;
}

function setup() {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  return { queryClient, invalidate };
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let interval: number | false | undefined;

function StreamProbe() {
  useMessageStream();
  interval = useInboxPollInterval(10_000, false);
  return null;
}

function mountStream(queryClient: QueryClient) {
  const container = document.createElement("div");
  root = createRoot(container);
  act(() =>
    root?.render(
      <QueryClientProvider client={queryClient}>
        <StreamProbe />
      </QueryClientProvider>,
    ),
  );
}

describe("message stream", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("confere só a primeira página da thread aberta e das listas de conversas", async () => {
    const { queryClient, invalidate } = setup();
    const thread = seedInfinite(
      queryClient,
      ["messages", "conv_1"],
      [page(["m3", "m2"], "c1"), page(["m1"], null)],
      page(["m4", "m3", "m2"], "c1"),
    );
    const inbox = seedInfinite(
      queryClient,
      ["conversations", "inbox", "SOCIAL"],
      [page(["conv_1"], "c1"), page(["conv_0"], null)],
      page(["conv_1"], "c1"),
    );

    await act(async () => {
      handleConversationChanged(queryClient, JSON.stringify({ conversationId: "conv_1" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    // Uma requisição por consulta, não uma por página carregada.
    expect(thread).toHaveBeenCalledTimes(1);
    expect(inbox).toHaveBeenCalledTimes(1);
    // E nada de invalidar o prefixo: era isso que refazia todas as páginas de todas as consultas.
    expect(invalidate).not.toHaveBeenCalled();

    const data = queryClient.getQueryData<{ pages: { items: { id: string }[] }[] }>([
      "messages",
      "conv_1",
    ]);
    expect(data?.pages[0].items.map((item) => item.id)).toEqual(["m4", "m3", "m2"]);
    // A página antiga continua onde estava: quem rolou o histórico não perde o lugar.
    expect(data?.pages[1].items.map((item) => item.id)).toEqual(["m1"]);
  });

  it("não busca a thread de uma conversa que não está na tela", async () => {
    const { queryClient } = setup();
    const thread = seedInfinite(
      queryClient,
      ["messages", "conv_2"],
      [page(["m1"], null)],
      page(["m2", "m1"], null),
    );
    // Sem observer: a conversa está fechada.
    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ["messages", "conv_2"], exact: true });
    if (query) vi.spyOn(query, "getObserversCount").mockReturnValue(0);

    await act(async () => {
      handleConversationChanged(queryClient, JSON.stringify({ conversationId: "conv_2" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(thread).not.toHaveBeenCalled();
  });

  it("ignora um sinal malformado", () => {
    const { queryClient, invalidate } = setup();
    handleConversationChanged(queryClient, "not json");
    handleConversationChanged(queryClient, JSON.stringify({ conversationId: 42 }));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("confere a primeira página dos avisos quando um aviso chega", async () => {
    const { queryClient, invalidate } = setup();
    const list = seedInfinite(
      queryClient,
      ["notifications", "SOCIAL"],
      [page(["n1"], "c1"), page(["n0"], null)],
      page(["n2", "n1"], "c1"),
    );

    await act(async () => {
      handleNotificationCreated(
        queryClient,
        JSON.stringify({ notificationId: "n2", kind: "POST_REPOSTED" }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(list).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
    const data = queryClient.getQueryData<{ pages: { items: { id: string }[] }[] }>([
      "notifications",
      "SOCIAL",
    ]);
    expect(data?.pages[0].items.map((item) => item.id)).toEqual(["n2", "n1"]);
  });

  it("ignora um aviso sem id", () => {
    const { queryClient, invalidate } = setup();
    handleNotificationCreated(queryClient, "not json");
    handleNotificationCreated(queryClient, JSON.stringify({ kind: "POST_REPOSTED" }));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("entrega o evento de aviso do stream ao cache", async () => {
    const { queryClient } = setup();
    const list = seedInfinite(
      queryClient,
      ["notifications", "SOCIAL"],
      [page(["n1"], null)],
      page(["n2", "n1"], null),
    );
    mountStream(queryClient);
    const source = FakeEventSource.instances[0];

    await act(async () => {
      source.emit("notification", JSON.stringify({ notificationId: "n2", kind: "NEW_COMMENT" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(list).toHaveBeenCalledTimes(1);
  });

  it("stops polling while the stream is live and polls again when it drops", () => {
    mountStream(setup().queryClient);
    const source = FakeEventSource.instances[0];
    expect(source.url).toContain("/conversations/stream");
    expect(source.init?.withCredentials).toBe(true);
    expect(interval).toBe(10_000);

    act(() => source.onopen?.());
    expect(interval).toBe(false);

    act(() => source.onerror?.());
    expect(interval).toBe(10_000);
  });

  it("reconnects after the browser gives up on the stream", () => {
    mountStream(setup().queryClient);
    const first = FakeEventSource.instances[0];

    first.readyState = FakeEventSource.CLOSED;
    act(() => first.onerror?.());
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => vi.advanceTimersByTime(30_000));
    expect(FakeEventSource.instances).toHaveLength(2);

    act(() => root?.unmount());
    root = null;
    expect(FakeEventSource.instances[1].closed).toBe(true);
  });
});
