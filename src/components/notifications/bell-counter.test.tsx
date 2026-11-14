// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsPopover } from "../notifications-popover";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/interface-context", () => ({ useInterfaceContext: () => "SOCIAL" }));

const { useNotificationsList } = vi.hoisted(() => ({ useNotificationsList: vi.fn() }));
vi.mock("./use-notifications-list", () => ({ useNotificationsList }));

const { useNotificationsPanel } = vi.hoisted(() => ({ useNotificationsPanel: vi.fn() }));
vi.mock("./use-notifications-panel", () => ({ useNotificationsPanel }));

const { useNavigationCounts, signalFor } = vi.hoisted(() => ({
  useNavigationCounts: vi.fn(),
  signalFor: vi.fn(),
}));
vi.mock("@/lib/navigation-signals", () => ({ useNavigationCounts, signalFor }));

function notification(id: string, read: boolean) {
  return {
    id,
    kind: "POST_LIKE",
    read,
    createdAt: new Date().toISOString(),
    href: "/feed",
    title: `aviso ${id}`,
  } as never;
}

/**
 * Pendência 2 (contador do sino vs resumo do servidor). O painel só carrega a primeira página
 * (10 itens), então o sino não pode contar as linhas em mãos: ele usa o total do resumo do
 * servidor via prop do DS (>= 0.35.0), pela mesma conta do sinal do menu. Com 12 não lidos e
 * preview de 10, o sino mostra 12.
 */
const twelveUnread = Array.from({ length: 12 }, (_, i) => notification(`n${i}`, false));
const preview = twelveUnread.slice(0, 10);

function panelValue() {
  return {
    notifications: preview.map((n) => n),
    requests: [],
    requestsLoading: false,
    stillPendingActorIds: new Set<string>(),
    acceptingActorId: null,
    rejectingActorId: null,
    markAllPending: false,
    onMarkAllRead: () => {},
    onMarkAsRead: () => {},
    onAcceptConnection: () => {},
    onRejectConnection: () => {},
    onOpenNotification: () => {},
    preferencesHref: "/notificacoes/preferencias",
  };
}

describe("contador do sino", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    useNotificationsList.mockReset().mockReturnValue({ latest: preview });
    useNotificationsPanel.mockReset().mockReturnValue(panelValue());
    // O total do resumo do servidor: 12 não lidos, menos módulos desativados já descontados na
    // fonte (useNavigationCounts); o sinal do menu é a mesma conta.
    useNavigationCounts
      .mockReset()
      .mockReturnValue({ summary: { total: 12 }, disabledModules: [] });
    signalFor.mockReset().mockReturnValue({ kind: "count", count: 12 });
    host = document.createElement("div");
    document.body.appendChild(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
  });

  it("mostra o total do servidor (12), nao o teto do preview carregado (10)", () => {
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <NotificationsPopover />
        </QueryClientProvider>,
      );
    });
    const pill = host.querySelector("button[aria-label*='aviso' i], button");
    expect(pill?.textContent).toContain("12");
    expect(pill?.textContent).not.toContain("10");
  });

  it("quando o resumo zera, o sino fica sem pílula mesmo com linhas nao lidas na pagina", () => {
    signalFor.mockReturnValue(null);
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <NotificationsPopover />
        </QueryClientProvider>,
      );
    });
    const pill = Array.from(host.querySelectorAll("button")).find((button) =>
      /aviso/i.test(button.getAttribute("aria-label") ?? ""),
    );
    expect(pill?.textContent).not.toContain("12");
    expect(pill?.textContent).not.toContain("10");
  });
});
