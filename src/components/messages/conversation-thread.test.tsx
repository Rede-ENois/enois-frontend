// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { messagesApi } from "@/lib/api";
import type { Message } from "@/types/application/message/message";

import { ConversationThread } from "./conversation-thread";

vi.mock("@/lib/api", () => ({
  messagesApi: {
    listMessages: vi.fn(),
    sendMessage: vi.fn(() => Promise.resolve({ id: "msg_new" })),
    hideMessages: vi.fn(),
    react: vi.fn(),
  },
  reportsApi: { create: vi.fn() },
  servicesApi: { mine: vi.fn(() => Promise.resolve({ ofertas: [] })) },
}));
vi.mock("@/lib/e2e/key-manager", () => ({ hasLocalKeys: () => Promise.resolve(false) }));
vi.mock("@/lib/e2e/use-decrypted-messages", () => ({
  useDecryptedMessages: (raw: { id: string; text: string }[]) => ({
    messages: raw.map((m) => ({ ...m, text: m.text ?? "" })),
    decrypting: false,
  }),
}));
vi.mock("@/lib/message-stream", () => ({
  useInboxPollInterval: () => false,
}));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/use-conversation-on-screen", () => ({
  useConversationOnScreen: () => {},
}));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({
    uploadAll: vi.fn(() => Promise.resolve([])),
    state: { status: "idle", progress: 0 },
  }),
}));
vi.mock("@/lib/conversation-peer", () => ({
  conversationPeer: () => ({
    peer: { id: "user_ana", name: "Ana" },
    profileHref: "/perfil/user_ana",
  }),
}));
vi.mock("@/lib/query-options/profiles", () => ({
  profileQueries: {
    byId: (id: string) => ({
      queryKey: ["profile", id],
      queryFn: () => Promise.resolve({ id, name: "Ana" }),
    }),
  },
}));
vi.mock("@/lib/api/e2e", () => ({
  e2eApi: { myConversationKey: vi.fn() },
}));
vi.mock("@rede-enois/design-system/domain", () => ({
  ConversationThread: ({
    children,
    onSend,
  }: {
    children?: React.ReactNode;
    onSend: (values: { text: string; files: File[]; mediaSpoiler: boolean; replyToId?: string }) => Promise<void>;
  }) => (
    <div>
      <button onClick={() => void onSend({ text: "oi", files: [], mediaSpoiler: false, replyToId: undefined })}>
        enviar
      </button>
      {children}
    </div>
  ),
}));
vi.mock("@rede-enois/design-system/ui", () => ({
  Button: ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...rest}>{children}</button>
  ),
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/components/calls/conversation-call-bar", () => ({
  ConversationCallBar: () => null,
}));
vi.mock("./message-bubble", () => ({
  MessageBubble: ({ message }: { message: { id: string } }) => <p>{message.id}</p>,
}));

vi.mock("@/lib/e2e/conversation", () => ({
  encryptForSend: vi.fn(() => Promise.resolve({ ciphertext: "x" })),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CONVERSATION = {
  id: "conv_1",
  title: "Conversa",
  participantIds: ["user_me", "user_ana"],
  unread: 0,
  lastMessage: "oi",
  lastMessageAt: "2026-11-16T10:00:00Z",
  archived: false,
};

function twoPages(first: string[], second: string[]) {
  const page = (items: string[], nextCursor: string | null) => ({
    items: items.map((id) => ({ id, from: "user_ana", text: `texto ${id}`, time: id })),
    nextCursor,
  });
  return { pages: [page(first, "cursor2"), page(second, null)], pageParams: [null, "cursor2"] };
}

describe("thread: envio não refaz o histórico inteiro", () => {
  let root: Root;
  let host: HTMLDivElement;
  let queryClient: QueryClient;
  let fetches: string[];

  beforeEach(() => {
    host = document.createElement("div");
    root = createRoot(host);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    fetches = [];
  });

  afterEach(() => act(() => root.unmount()));

  it("após enviar, só a primeira página da thread aberta é buscada de novo", async () => {
    const msg = (id: string, text: string): Message =>
      ({ id, from: "user_ana", text, time: "t" }) as Message;
    vi.mocked(messagesApi.listMessages).mockImplementation(
      (_conv: string, cursor?: string | null) => {
        fetches.push(cursor ?? "primeira");
        return Promise.resolve(
          cursor === null
            ? { items: [msg("m1", "a")], nextCursor: "c2" }
            : { items: [msg("m2", "b")], nextCursor: null },
        );
      },
    );

    // Thread com DUAS páginas em cache: quem rolou até o fim não pode ter o histórico refeito.
    queryClient.setQueryData(["messages", "conv_1"], twoPages(["m1"], ["m2"]));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ConversationThread
            conversation={CONVERSATION as never}
            currentUserId="user_me"
            onBack={() => {}}
          />
        </QueryClientProvider>,
      );
    });
    await act(async () => {});

    fetches = [];
    await act(async () => {
      host.querySelector("button")!.click();
    });
    // Espera o onSuccess do envio terminar de revalidar.
    for (let turn = 0; turn < 100 && queryClient.isFetching() > 0; turn += 1) {
      await act(async () => {});
    }
    await act(async () => {});

    // O envio confirma no servidor; a thread na tela refaz só a PRIMEIRA página — a página antiga
    // (m2, que a pessoa carregou rolando) continua servida do cache.
    expect(fetches).toEqual(["primeira"]);
    expect(queryClient.getQueryData(["messages", "conv_1"])).toMatchObject({
      pages: [
        expect.objectContaining({ items: [expect.objectContaining({ id: "m1" })] }),
        expect.objectContaining({ items: [expect.objectContaining({ id: "m2" })] }),
      ],
    });
  });
});
