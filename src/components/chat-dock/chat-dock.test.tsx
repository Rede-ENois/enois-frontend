// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useChatDockStore } from "@/stores/chat-dock.store";
import type { ChatDockProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatDock } from "./chat-dock";

const mocks = vi.hoisted(() => ({
  context: "SOCIAL" as "SOCIAL" | "PROFESSIONAL",
  unread: { SOCIAL: 0, PROFESSIONAL: 1 } as Record<string, number>,
  keys: true,
}));

vi.mock("@/lib/interface-context", () => ({ useInterfaceContext: () => mocks.context }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));
vi.mock("@/lib/e2e/key-manager", () => ({ hasLocalKeys: () => Promise.resolve(mocks.keys) }));
vi.mock("@/lib/api", () => ({
  authApi: { me: () => Promise.resolve({ hasPassword: true }) },
  messagesApi: {
    listConversations: () => Promise.resolve({ items: [], nextCursor: null }),
    unreadCount: (context: string) => Promise.resolve({ count: mocks.unread[context] }),
    markAsRead: vi.fn(),
  },
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ChatDock: ({ expanded, contextLabel, empty, children }: ChatDockProps) => (
    <div data-expanded={String(expanded)} data-label={contextLabel}>
      {empty ? "Nenhuma conversa ainda." : children}
    </div>
  ),
}));
vi.mock("./chat-dock-window", () => ({ ChatDockWindow: () => null }));
vi.mock("@/components/messages/conversation-item", () => ({ ConversationItem: () => null }));
vi.mock("@/components/messages/e2e-setup-banner", () => ({
  E2eSetupBanner: () => <p>Configure as chaves</p>,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("dock de mensagens", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    window.localStorage.clear();
    useChatDockStore.setState({ expanded: false, openChats: [] });
    mocks.context = "SOCIAL";
    mocks.unread = { SOCIAL: 0, PROFESSIONAL: 1 };
    mocks.keys = true;
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const render = async () => {
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <ChatDock />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };
  const dock = () => host.querySelector("[data-expanded]");

  it("começa fechado e diz qual caixa mostra", async () => {
    await render();
    expect(dock()?.getAttribute("data-expanded")).toBe("false");
    expect(dock()?.getAttribute("data-label")).toBe("Social");
  });

  it("trocar para uma interface com mensagens não lidas não abre o dock sozinho", async () => {
    await render();
    mocks.context = "PROFESSIONAL";
    await render();

    expect(dock()?.getAttribute("data-label")).toBe("Profissional");
    expect(useChatDockStore.getState().expanded).toBe(false);
  });

  it("sem as chaves neste aparelho, mostra a configuração e não diz que não há conversas", async () => {
    mocks.keys = false;
    await render();

    expect(host.textContent).toContain("Configure as chaves");
    expect(host.textContent).not.toContain("Nenhuma conversa ainda.");
    expect(dock()?.getAttribute("data-label")).toBe("Social");
  });

  it("mensagem nova na mesma interface abre o dock", async () => {
    await render();
    mocks.unread.SOCIAL = 1;
    await act(() => client.invalidateQueries({ queryKey: ["conversations", "unread-count"] }));
    await flush();

    expect(useChatDockStore.getState().expanded).toBe(true);
  });
});
