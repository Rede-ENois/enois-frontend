// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("o sino e a página dividem um único fetch da mesma lista", async () => {
    // Antes: o sino usava ["notifications", ctx] com limit=20 e a página
    // ["notifications","page",ctx] com limit=30 — duas chaves, duas chamadas na mesma carga, e a
    // página nunca aproveitava o cache do sino. Agora as duas montagens resolvem a MESMA consulta.
    await render();

    expect(mocks.list).toHaveBeenCalledTimes(1);
    expect(mocks.list).toHaveBeenCalledWith(null, 30, "SOCIAL");
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe("n1");
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

  it("recarrega sozinha quando o stream está fora", async () => {
    // Antes não havia recarga nenhuma: sem stream, o aviso só aparecia ao carregar a página de novo.
    await render();
    expect(mocks.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS * 3));
    });
    await flush();

    // O que importa é que a recarga aconteceu sozinha, sem ninguém pedir.
    expect(mocks.list.mock.calls.length).toBeGreaterThan(1);
  });

  it("não consulta enquanto o stream entrega os avisos", async () => {
    mocks.live.mockReturnValue(true);
    await render();
    expect(mocks.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS * 3));
    });
    await flush();

    expect(mocks.list).toHaveBeenCalledTimes(1);
  });
});
