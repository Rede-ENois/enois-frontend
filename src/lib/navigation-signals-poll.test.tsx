// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNavigationCounts } from "./navigation-signals";

const mocks = vi.hoisted(() => ({ live: vi.fn() }));

vi.mock("@/lib/api", () => ({
  notificationsApi: { unreadSummary: vi.fn().mockResolvedValue({ total: 0, byModule: {} }) },
  messagesApi: { unreadCount: vi.fn().mockResolvedValue({ count: 0 }) },
}));

vi.mock("@/lib/query-options/network", () => ({
  networkQueries: {
    requests: () => ({ queryKey: ["network", "requests"], queryFn: async () => ({ items: [] }) }),
  },
}));

vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/interface-context", () => ({ useInterfaceContext: () => "SOCIAL" }));
vi.mock("@/lib/use-personalization", () => ({ useDisabledModules: () => new Set() }));

// O stream é o que decide se o resumo precisa de polling: com ele aberto, o aviso chega por evento.
vi.mock("@/lib/message-stream", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/message-stream")>()),
  useInboxPollInterval: (baseMs: number) => (mocks.live() ? false : baseMs),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  useNavigationCounts();
  return null;
}

let root: Root | undefined;
let container: HTMLDivElement | undefined;

function render(client: QueryClient) {
  container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root?.render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  });
}

function summaryInterval(client: QueryClient) {
  const query = client
    .getQueryCache()
    .find({ queryKey: ["notifications", "summary", "SOCIAL"], exact: true });
  return (query?.options as { refetchInterval?: number | false } | undefined)?.refetchInterval;
}

describe("useNavigationCounts", () => {
  beforeEach(() => {
    mocks.live.mockReset();
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    container = undefined;
  });

  it("não faz polling do resumo enquanto o stream entrega os avisos", () => {
    mocks.live.mockReturnValue(true);
    const client = new QueryClient();
    render(client);
    expect(summaryInterval(client)).toBe(false);
  });

  it("volta ao polling de segurança quando o stream cai", () => {
    mocks.live.mockReturnValue(false);
    const client = new QueryClient();
    render(client);
    expect(summaryInterval(client)).toBe(120_000);
  });
});
