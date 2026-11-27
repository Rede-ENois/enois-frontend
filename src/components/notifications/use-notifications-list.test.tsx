// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";
import type { Notification } from "@/types/application/notification/notification";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notificationsApi } from "@/lib/api";

import { useNotificationsList } from "./use-notifications-list";

const mocks = vi.hoisted(() => ({ list: vi.fn(), live: vi.fn() }));

/** Intervalo curto de verdade: o teste espera a recarga acontecer, sem relógio falso. */
const POLL_MS = 20;

vi.mock("@/lib/api", () => ({ notificationsApi: { list: mocks.list } }));

// O intervalo vem do stream: com o stream aberto ele é `false` (o aviso chega por evento), sem
// ele é a recarga de segurança. Aqui o stream é controlado pelo teste.
vi.mock("@/lib/message-stream", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/message-stream")>()),
  useInboxPollInterval: () => (mocks.live() ? false : POLL_MS),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PAGE = {
  items: [
    { id: "n1", read: false, kind: "support_ticket_closed", createdAt: "2026-11-01T10:00:00Z" },
  ],
  nextCursor: null,
};

function notice(id: string, read: boolean, createdAt: string, kind = "reaction"): Notification {
  return {
    id,
    kind,
    read,
    createdAt,
    actorId: null,
    actorName: null,
    actorUsername: null,
    actorAvatar: null,
    title: "Aviso",
    body: "Aviso de teste",
    href: "/notificacoes",
    ctaLabel: "Ver",
  };
}

/**
 * Responde cada lista pelo 4º argumento, uma página por chamada, na ordem dada. A última página se
 * repete: uma chamada a mais (renovação, polling) recebe uma página em vez de `undefined`, que o
 * React Query rejeita.
 */
function serveLists(pages: {
  unreadFirst: PageResponse<Notification>[];
  recent: PageResponse<Notification>[];
}) {
  const queues = { unreadFirst: [...pages.unreadFirst], recent: [...pages.recent] };
  vi.mocked(notificationsApi.list).mockImplementation(
    async (_cursor, _limit, _context, options) => {
      const queue = options?.unreadFirst ? queues.unreadFirst : queues.recent;
      const page = queue.length > 1 ? queue.shift() : queue[0];
      if (!page) throw new Error("serveLists: lista sem página");
      return page;
    },
  );
}

/** The bell (in the header) and the whole page (the dock's Avisos) mount side by side. */
function Bell({ onList }: { onList: (state: ReturnType<typeof useNotificationsList>) => void }) {
  onList(useNotificationsList("SOCIAL"));
  return null;
}

function Page({ onList }: { onList: (state: ReturnType<typeof useNotificationsList>) => void }) {
  onList(useNotificationsList("SOCIAL"));
  return null;
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("lista de avisos compartilhada", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;
  let page: ReturnType<typeof useNotificationsList>;

  beforeEach(() => {
    mocks.list.mockReset().mockResolvedValue(PAGE);
    mocks.live.mockReset().mockReturnValue(false);
    host = document.createElement("div");
    document.body.appendChild(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
    page = undefined as unknown as ReturnType<typeof useNotificationsList>;
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
  });

  const render = async () => {
    await act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <Bell onList={() => {}} />
          <Page
            onList={(state) => {
              page = state;
            }}
          />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("o sino e a página dividem um único fetch de cada lista", async () => {
    // Antes: o sino usava ["notifications", ctx] com limit=20 e a página
    // ["notifications","page",ctx] com limit=30 — duas chaves, duas chamadas na mesma carga, e a
    // página nunca aproveitava o cache do sino. Agora as duas montagens resolvem as MESMAS
    // consultas: uma chamada da lista que alimenta o Histórico e uma da que alimenta Novas,
    // nada mais.
    // O stream fica aberto para a recarga periódica não entrar na contagem: o que este teste prende
    // é a deduplicação das duas montagens, não o polling (que tem teste próprio).
    mocks.live.mockReturnValue(true);
    await render();

    expect(mocks.list).toHaveBeenCalledTimes(2);
    // Dez por página: a lista carrega aos poucos, como o feed e as mensagens. A lista que alimenta
    // o Histórico vai sem opção nenhuma, exatamente como antes.
    expect(mocks.list).toHaveBeenCalledWith(null, 10, "SOCIAL");
    expect(mocks.list).toHaveBeenCalledWith(null, 10, "SOCIAL", { unreadFirst: true });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe("n1");
  });

  it("não repete a mesma notificação quando ela aparece em duas páginas", async () => {
    // O servidor reescreve `createdAt` ao agrupar avisos: a mesma linha pode voltar na página
    // seguinte já carregada. Sem dedupe por id, ela aparecia duas vezes na lista.
    mocks.live.mockReturnValue(true);
    mocks.list.mockResolvedValueOnce({
      items: [
        { id: "n1", read: false, kind: "support_ticket_closed", createdAt: "2026-11-01T10:00:00Z" },
      ],
      nextCursor: "c1",
    });
    await render();
    expect(page.items).toHaveLength(1);

    mocks.list.mockResolvedValueOnce({
      items: [
        { id: "n1", read: false, kind: "support_ticket_closed", createdAt: "2026-11-01T10:00:00Z" },
        { id: "n0", read: true, kind: "support_ticket_closed", createdAt: "2026-10-31T10:00:00Z" },
      ],
      nextCursor: null,
    });
    await act(async () => {
      await page.fetchNextPage();
    });
    await flush();

    expect(page.items.map((item) => item.id)).toEqual(["n1", "n0"]);
  });

  it("ao voltar para a aba, a lista anterior fica na tela durante a revalidação", async () => {
    await render();
    expect(page.items).toHaveLength(1);

    // Revalidação (volta ao dock depois do staleTime): a resposta demora e os itens continuam na
    // tela, em vez de a aba piscar vazia como faria uma recarga.
    let release: (value: typeof PAGE) => void = () => {};
    mocks.list.mockImplementation(
      () =>
        new Promise<typeof PAGE>((resolve) => {
          release = resolve;
        }),
    );
    // `refetch()` fica pendente até `release()`; sem await nele, o act não trava esperando a resposta.
    act(() => {
      void page.refetch();
    });
    await flush();
    expect(page.items).toHaveLength(1);

    await act(async () => release(PAGE));
    await flush();
    expect(page.items).toHaveLength(1);
  });

  it("renovar pede de novo as duas listas", async () => {
    await render();
    vi.mocked(notificationsApi.list).mockClear();

    await act(async () => {
      await page.refetch();
    });

    const unreadFirstFlags = vi
      .mocked(notificationsApi.list)
      .mock.calls.map((call) => call[3]?.unreadFirst === true)
      .sort();
    expect(unreadFirstFlags).toEqual([false, true]);
  });

  it("a ação de renovar não muda entre renders, para o gesto de puxar não refazer os listeners a cada toque", async () => {
    await render();
    const renew = page.refetch;

    await render();

    expect(page.refetch).toBe(renew);
  });

  it("recarrega sozinha quando o stream está fora", async () => {
    // Antes não havia recarga nenhuma: sem stream, o aviso só aparecia ao carregar a página de novo.
    await render();
    // A contagem inicial não é o que importa (o intervalo curto pode já ter disparado durante a
    // montagem); o que este teste prende é que a recarga acontece sozinha depois.
    const afterRender = mocks.list.mock.calls.length;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS * 3));
    });
    await flush();

    // O que importa é que a recarga aconteceu sozinha, sem ninguém pedir.
    expect(mocks.list.mock.calls.length).toBeGreaterThan(afterRender);
  });

  it("traz o aviso não lido empurrado para a página seguinte pela lista que alimenta o Histórico", async () => {
    // Issue #1147: dez mensagens lidas mais novas enchiam a página 1 da lista, em ordem de chegada,
    // e a reação não lida ficava na página 2, nunca carregada: o sino contava 1 e "Novas" ficava
    // vazia.
    mocks.live.mockReturnValue(true);
    const readMessages = Array.from({ length: 10 }, (_, i) =>
      notice(`m${i}`, true, `2026-11-02T10:${String(10 + i).padStart(2, "0")}:00Z`, "new_message"),
    );
    const reaction = notice("r1", false, "2026-11-02T09:00:00Z");
    vi.mocked(notificationsApi.list).mockImplementation(
      async (_cursor, _limit, _context, options) =>
        options?.unreadFirst
          ? { items: [reaction], nextCursor: null }
          : { items: readMessages, nextCursor: "2026-11-02T10:10:00Z" },
    );

    await render();

    expect(page.items).toContainEqual(reaction);
  });

  it("com dez ou mais não lidos, o Histórico continua recebendo os lidos recentes", async () => {
    // Trocar a lista inteira para `unreadFirst=true` deixaria a página 1 só com não lidos: o
    // Histórico ficaria vazio e, sem linhas, o painel nem mostra "Carregar mais".
    mocks.live.mockReturnValue(true);
    const unread = Array.from({ length: 10 }, (_, i) =>
      notice(`u${i}`, false, `2026-11-03T10:${10 + i}:00Z`),
    );
    const read = Array.from({ length: 10 }, (_, i) =>
      notice(`h${i}`, true, `2026-11-02T10:${10 + i}:00Z`),
    );
    serveLists({
      unreadFirst: [{ items: unread, nextCursor: "o:10" }],
      recent: [{ items: read, nextCursor: "2026-11-02T10:10:00Z" }],
    });

    await render();

    expect(page.items.filter((item) => !item.read)).toHaveLength(10);
    expect(page.items.filter((item) => item.read)).toHaveLength(10);
  });

  it("une as duas listas: um aviso por id, lido vence, do mais novo ao mais velho", async () => {
    mocks.live.mockReturnValue(true);
    serveLists({
      unreadFirst: [
        {
          items: [
            notice("a", false, "2026-11-02T12:00:00Z"),
            notice("same", false, "2026-11-02T11:00:00Z"),
            notice("c", false, "2026-11-02T09:00:00Z"),
          ],
          nextCursor: null,
        },
      ],
      recent: [
        {
          items: [
            notice("same", true, "2026-11-02T11:00:00Z"),
            notice("b", true, "2026-11-02T10:00:00Z"),
          ],
          nextCursor: null,
        },
      ],
    });

    await render();

    expect(page.items.map((item) => [item.id, item.read])).toEqual([
      ["a", false],
      ["same", true],
      ["b", true],
      ["c", false],
    ]);
    expect(page.latest.map((item) => item.id)).toEqual(["a", "same", "b", "c"]);
  });

  it("lido vence também quando a lista que alimenta o Histórico ainda traz a versão não lida", async () => {
    mocks.live.mockReturnValue(true);
    serveLists({
      unreadFirst: [{ items: [notice("same", true, "2026-11-02T11:00:00Z")], nextCursor: null }],
      recent: [{ items: [notice("same", false, "2026-11-02T11:00:00Z")], nextCursor: null }],
    });

    await render();

    expect(page.items.map((item) => [item.id, item.read])).toEqual([["same", true]]);
  });

  it("carregar mais avança cada lista pelo próprio cursor e só a que tem próxima página", async () => {
    mocks.live.mockReturnValue(true);
    serveLists({
      unreadFirst: [
        { items: [notice("u1", false, "2026-11-02T09:00:00Z")], nextCursor: "o:10" },
        { items: [notice("u2", false, "2026-11-01T09:00:00Z")], nextCursor: null },
      ],
      recent: [{ items: [notice("r1", true, "2026-11-02T10:00:00Z")], nextCursor: null }],
    });
    await render();
    expect(page.hasNextPage).toBe(true);

    await act(async () => {
      await page.fetchNextPage();
    });
    await flush();

    expect(mocks.list).toHaveBeenCalledTimes(3);
    expect(mocks.list).toHaveBeenLastCalledWith("o:10", 10, "SOCIAL", { unreadFirst: true });
    expect(page.items.map((item) => item.id)).toEqual(["r1", "u1", "u2"]);
    expect(page.hasNextPage).toBe(false);
  });

  it("carregar mais na lista que alimenta o Histórico continua da data do último aviso, sem pedir os não lidos primeiro", async () => {
    mocks.live.mockReturnValue(true);
    serveLists({
      unreadFirst: [{ items: [], nextCursor: null }],
      recent: [
        { items: [notice("r1", true, "2026-11-02T10:00:00Z")], nextCursor: "2026-11-02T10:00:00Z" },
        { items: [notice("r0", true, "2026-11-01T10:00:00Z")], nextCursor: null },
      ],
    });
    await render();

    await act(async () => {
      await page.fetchNextPage();
    });
    await flush();

    expect(mocks.list).toHaveBeenCalledTimes(3);
    expect(mocks.list).toHaveBeenCalledWith("2026-11-02T10:00:00Z", 10, "SOCIAL");
    expect(page.items.map((item) => item.id)).toEqual(["r1", "r0"]);
  });

  it("não consulta enquanto o stream entrega os avisos", async () => {
    mocks.live.mockReturnValue(true);
    await render();
    // Duas na montagem porque cada lista tem a sua chave; o que este teste prende é que o número
    // não cresce depois.
    expect(mocks.list).toHaveBeenCalledTimes(2);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS * 3));
    });
    await flush();

    expect(mocks.list).toHaveBeenCalledTimes(2);
  });
});
