// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Abrir conversa a partir da busca: o botao da pessoa nao pode disparar duas criacoes. Antes da
 * guarda, dois toques antes da resposta criavam duas conversas com a mesma pessoa — o servidor so
 * deduplica depois, e a lista ficava com duas linhas iguais.
 */

const mocks = vi.hoisted(() => ({
  listConversations: vi.fn(),
  archivedConversations: vi.fn(),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
  unreadCount: vi.fn(),
  networkList: vi.fn(),
  authMe: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({ conversation: undefined }),
  }),
  useSearch: () => ({ conversation: undefined }),
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/lib/interface-context", () => ({
  useInterfaceContext: () => "SOCIAL",
  writeStoredContext: () => undefined,
}));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/message-stream", () => ({ useInboxPollInterval: () => false }));
vi.mock("@/lib/lite-mode", () => ({ litePageSize: (size: number) => size }));
vi.mock("@/lib/e2e/key-manager", () => ({ isE2eReady: () => Promise.resolve(true) }));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ id: "me" }) }));
vi.mock("@/stores/app-shell.store", () => ({
  useAppShellStore: (selector: (state: { setConversationOpen: () => void }) => unknown) =>
    selector({ setConversationOpen: () => undefined }),
}));
vi.mock("@/lib/api", () => ({
  authApi: { me: mocks.authMe },
  messagesApi: {
    listConversations: mocks.listConversations,
    archivedConversations: mocks.archivedConversations,
    getConversation: mocks.getConversation,
    createConversation: mocks.createConversation,
    unreadCount: mocks.unreadCount,
    unhideConversations: vi.fn(),
    hideConversations: vi.fn(),
  },
  networkApi: { list: mocks.networkList },
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/messages/conversation-item", () => ({
  ConversationItem: ({ conversation }: { conversation: { id: string } }) => (
    <li data-testid={`conversa-${conversation.id}`} />
  ),
}));
vi.mock("@/components/messages/conversation-thread", () => ({
  ConversationThread: () => <div data-testid="thread" />,
}));
vi.mock("@/components/messages/e2e-setup-banner", () => ({
  E2eSetupBanner: () => <div data-testid="e2e" />,
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ConversationListSkeletons: () => <div data-testid="skeleton" />,
  UserAvatar: () => <span />,
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
  ConfirmDialog: () => null,
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
  Pill: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  PillRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PullIndicator: () => <div data-testid="puxando" />,
  useToast: () => vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { Route } = await import("./mensagens");
const Mensagens = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

describe("/mensagens — abrir conversa pela busca", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;
  let pending: () => void;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  beforeEach(async () => {
    mocks.listConversations.mockReset().mockResolvedValue({ items: [], nextCursor: null });
    mocks.archivedConversations.mockReset().mockResolvedValue({ items: [], nextCursor: null });
    mocks.getConversation.mockReset().mockResolvedValue(null);
    mocks.unreadCount.mockReset().mockResolvedValue({ count: 0 });
    mocks.authMe.mockReset().mockResolvedValue({ hasPassword: true, id: "me" });
    mocks.networkList
      .mockReset()
      .mockResolvedValue({ items: [{ id: "u1", name: "Fulana", avatar: null }] });
    // A criacao fica EM CURSO ate o teste soltar: e nesse intervalo que o segundo toque chega.
    mocks.createConversation.mockReset().mockImplementation(
      () =>
        new Promise((resolve) => {
          pending = () => resolve({ id: "c1" });
        }),
    );

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
          <Mensagens />
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

  it("o segundo toque, com a criacao em curso, nao cria outra conversa", async () => {
    const openSearch = Array.from(host.querySelectorAll("button")).find((button) =>
      /nova/i.test(button.textContent ?? ""),
    );
    expect(openSearch, "o botão de nova conversa deveria estar na tela").toBeTruthy();
    await act(async () => openSearch!.click());
    await settle();

    const input = host.querySelector("input");
    expect(input, "o campo de busca deveria abrir").toBeTruthy();
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "Ful");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settle();

    const person = Array.from(host.querySelectorAll("button")).find((button) =>
      /Fulana/.test(button.textContent ?? ""),
    );
    expect(person, "a pessoa buscada deveria aparecer").toBeTruthy();

    await act(async () => {
      person!.click();
      person!.click();
    });
    await settle();

    expect(mocks.createConversation).toHaveBeenCalledTimes(1);

    await act(async () => pending());
    await settle();
  });
});
