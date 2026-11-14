// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Página de avisos: o gesto de puxar para renovar é o mesmo do feed. O que este arquivo trava é
 * que ele existe AQUI — antes, a página de avisos não tinha nenhuma forma de atualizar a lista
 * sem sair e voltar, enquanto o feed já tinha o gesto.
 */

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  requests: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/lib/interface-context", () => ({ useInterfaceContext: () => "SOCIAL" }));
vi.mock("@/lib/use-personalization", () => ({ useDisabledModules: () => [] }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/message-stream", () => ({ useInboxPollInterval: () => false }));
vi.mock("@/lib/api", () => ({
  notificationsApi: { list: mocks.list, markAsRead: vi.fn(), markAllAsRead: vi.fn() },
  networkApi: { accept: vi.fn(), remove: vi.fn() },
}));
vi.mock("@/lib/query-options/network", () => ({
  networkQueries: {
    all: ["network"],
    requests: () => ({ queryKey: ["network", "requests"], queryFn: mocks.requests }),
  },
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  NotificationsPanel: () => <div data-testid="painel" />,
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  PullIndicator: () => <div data-testid="puxando" />,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PAGE = { items: [], nextCursor: null };

const { Route } = await import("./notificacoes.index");
const NotificationsPage = (Route as unknown as { options: { component: () => React.JSX.Element } })
  .options.component;

/** Simula o gesto de puxar: sequência de eventos de toque no window. */
function pull(distance: number) {
  window.dispatchEvent(
    new TouchEvent("touchstart", { touches: [{ clientX: 10, clientY: 0 }] as unknown as Touch[] }),
  );
  window.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [{ clientX: 10, clientY: distance }] as unknown as Touch[],
    }),
  );
  window.dispatchEvent(new TouchEvent("touchend", { touches: [] as unknown as Touch[] }));
}

describe("/notificacoes — puxar para renovar", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  beforeEach(async () => {
    mocks.list.mockReset().mockResolvedValue(PAGE);
    mocks.requests.mockReset().mockResolvedValue({ items: [] });
    mocks.refetch.mockReset();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <NotificationsPage />
        </QueryClientProvider>,
      ),
    );
    await settle();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
  });

  it("uma puxada passando do limite pede uma nova busca da lista", async () => {
    const before = mocks.list.mock.calls.length;
    await act(async () => pull(90));
    await settle();
    expect(mocks.list.mock.calls.length).toBeGreaterThan(before);
  });

  it("uma puxada curta não busca de novo", async () => {
    const before = mocks.list.mock.calls.length;
    await act(async () => pull(30));
    await settle();
    expect(mocks.list.mock.calls.length).toBe(before);
  });
});
