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
 * Pendência 2 (contador do sino vs resumo do servidor). O DS 0.33.0 conta o sininho filtrando
 * `panel.notifications` (que só carrega a primeira página, 10 itens). Com mais avisos não lidos do
 * que o preview, o sino mostra o teto da página e o menu mostra o total do resumo — os dois
 * divergem por construção. Este teste fixa o comportamento atual enquanto o DS não recebe a
 * contagem por prop.
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

  it("conta pelo preview carregado (primeira pagina), nao pelo total do servidor", () => {
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <NotificationsPopover />
        </QueryClientProvider>,
      );
    });
    const pill = host.querySelector("button[aria-label*='aviso' i], button");
    expect(pill?.textContent).toContain("10");
    expect(pill?.textContent).not.toContain("12");
  });
});
