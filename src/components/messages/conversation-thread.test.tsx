// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Message } from "@/types/application/message/message";
import type { ConversationThreadProps } from "@/types/routes/messages/conversation-thread-props";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConversationThread } from "./conversation-thread";

const mocks = vi.hoisted(() => ({ listMessages: vi.fn(), toast: vi.fn() }));

vi.mock("@/lib/api", () => ({
  messagesApi: { listMessages: mocks.listMessages },
  servicesApi: { mine: vi.fn() },
  reportsApi: { create: vi.fn() },
}));
vi.mock("@/lib/e2e/use-decrypted-messages", () => ({
  useDecryptedMessages: (messages: Message[]) => ({ messages, decrypting: false }),
}));
vi.mock("@/lib/e2e/conversation", () => ({ encryptForSend: vi.fn() }));
vi.mock("@/lib/use-conversation-on-screen", () => ({ useConversationOnScreen: vi.fn() }));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/message-stream", () => ({ useInboxPollInterval: () => false }));
vi.mock("@/lib/use-media-upload", () => ({ useMediaUpload: () => ({ uploadAll: vi.fn() }) }));
vi.mock("@/lib/query-options/profiles", () => ({
  profileQueries: { byId: () => ({ queryKey: ["profile-test"], queryFn: () => null }) },
}));
vi.mock("../calls/conversation-call-bar", () => ({ ConversationCallBar: () => null }));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@rede-enois/design-system/ui")>()),
  useToast: () => ({ toast: mocks.toast }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const conversation: ConversationThreadProps["conversation"] = {
  id: "conversation-a",
  kind: "DIRECT",
  participantIds: ["viewer", "peer"],
  title: "Conversa fictícia",
  time: null,
  lastMessage: null,
  unread: 0,
};

function message(id: string, extra: Partial<Message> = {}): Message {
  return {
    id,
    conversationId: conversation.id,
    from: "viewer",
    text: `Texto fictício ${id}`,
    mediaIds: [],
    time: "2026-11-01T12:00:00Z",
    ...extra,
  };
}

const original = message("original");
const reply = message("reply", {
  time: "2026-11-02T12:00:00Z",
  // O destino vem do preview efetivamente exibido, não de um id alternativo divergente.
  replyToId: "wrong-id",
  replyTo: { id: "original", from: "viewer", text: "Trecho fictício original", e2e: false },
});

const flush = () =>
  act(async () => {
    for (let index = 0; index < 5; index++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("ConversationThread: integração com a view real do design system", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    mocks.listMessages.mockReset();
    mocks.toast.mockReset();
    HTMLElement.prototype.scrollTo = vi.fn();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    vi.restoreAllMocks();
  });

  const render = async (id = conversation.id, copies = 1) => {
    await act(() =>
      root.render(
        <QueryClientProvider client={client}>
          {Array.from({ length: copies }, (_, index) => (
            <ConversationThread
              key={index}
              conversation={{ ...conversation, id }}
              currentUserId="viewer"
            />
          ))}
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("o clique na citação real foca o original já renderizado", async () => {
    client.setQueryData(["messages", conversation.id], {
      pages: [{ items: [original, reply], nextCursor: "older" }],
      pageParams: [null],
    });
    await render();
    const quote = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Ir para mensagem original"]',
    );
    expect(quote).not.toBeNull();

    await act(async () => quote!.click());
    await flush();

    expect(document.activeElement).toBe(host.querySelector("#message-original"));
    expect(mocks.listMessages).not.toHaveBeenCalled();
  });

  it("carrega só até a página do original e deduplica cliques pendentes", async () => {
    client.setQueryData(["messages", conversation.id], {
      pages: [{ items: [reply], nextCursor: "older-1" }],
      pageParams: [null],
    });
    let release: (value: { items: Message[]; nextCursor: string }) => void = () => {};
    mocks.listMessages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    mocks.listMessages.mockResolvedValueOnce({ items: [original], nextCursor: "not-needed" });
    await render();
    const quote = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Ir para mensagem original"]',
    );
    expect(quote).not.toBeNull();

    act(() => {
      quote!.click();
      quote!.click();
    });
    expect(mocks.listMessages).toHaveBeenCalledExactlyOnceWith(conversation.id, "older-1", 50);
    expect(mocks.toast).toHaveBeenCalledWith(texts.messages.loadingReply);
    await act(async () => release({ items: [message("intermediate")], nextCursor: "older-2" }));
    await flush();

    expect(mocks.listMessages).toHaveBeenCalledTimes(2);
    expect(mocks.listMessages).toHaveBeenLastCalledWith(conversation.id, "older-2", 50);
    expect(document.activeElement).toBe(host.querySelector("#message-original"));
  });

  it("aguarda um refetch pendente antes de buscar a página da original", async () => {
    const page = { items: [reply], nextCursor: "older" };
    client.setQueryData(["messages", conversation.id], { pages: [page], pageParams: [null] });
    await render();
    let release: (value: typeof page) => void = () => {};
    mocks.listMessages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    mocks.listMessages.mockResolvedValueOnce({ items: [original], nextCursor: null });
    let refetch: Promise<void> = Promise.resolve();
    act(() => {
      refetch = client.refetchQueries({ queryKey: ["messages", conversation.id] });
    });
    const quote = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Ir para mensagem original"]',
    );
    expect(quote).not.toBeNull();
    act(() => quote!.click());
    expect(mocks.listMessages).toHaveBeenCalledExactlyOnceWith(conversation.id, null, 50);
    await act(async () => {
      release(page);
      await refetch;
    });
    await flush();
    expect(mocks.listMessages).toHaveBeenLastCalledWith(conversation.id, "older", 50);
    expect(document.activeElement).toBe(host.querySelector("#message-original"));
    expect(mocks.toast).not.toHaveBeenCalledWith(texts.messages.replyNavigationError, "error");
  });

  it("não inicia paginação após trocar de conversa durante o refetch", async () => {
    const page = { items: [reply], nextCursor: "older" };
    client.setQueryData(["messages", conversation.id], { pages: [page], pageParams: [null] });
    await render();
    let release: (value: typeof page) => void = () => {};
    mocks.listMessages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    mocks.listMessages.mockResolvedValue({ items: [], nextCursor: null });
    let refetch: Promise<void> = Promise.resolve();
    act(() => {
      refetch = client.refetchQueries({ queryKey: ["messages", conversation.id] });
    });
    act(() =>
      host
        .querySelector<HTMLButtonElement>('button[aria-label="Ir para mensagem original"]')!
        .click(),
    );
    await render("conversation-b");
    await act(async () => {
      release(page);
      await refetch;
    });
    await flush();
    expect(mocks.listMessages).not.toHaveBeenCalledWith(conversation.id, "older", 50);
    expect(mocks.toast).not.toHaveBeenCalledWith(texts.messages.replyNavigationError, "error");
    expect(document.activeElement?.id).not.toBe("message-original");
  });

  it("mantém o destino dentro da thread clicada quando o dock duplica ids", async () => {
    client.setQueryData(["messages", conversation.id], {
      pages: [{ items: [original, reply], nextCursor: null }],
      pageParams: [null],
    });
    await render(conversation.id, 2);
    const quotes = host.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Ir para mensagem original"]',
    );
    expect(quotes).toHaveLength(2);

    await act(async () => quotes[1].click());

    expect(document.activeElement).toBe(host.querySelectorAll("#message-original")[1]);
    expect(mocks.listMessages).not.toHaveBeenCalled();
  });

  it.each(["missing", "network"])("expõe a falha %s em toast", async (failure) => {
    client.setQueryData(["messages", conversation.id], {
      pages: [{ items: [reply], nextCursor: "older" }],
      pageParams: [null],
    });
    if (failure === "missing")
      mocks.listMessages.mockResolvedValueOnce({ items: [], nextCursor: null });
    else mocks.listMessages.mockRejectedValueOnce(new Error("falha de rede sintética"));
    await render();
    const quote = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Ir para mensagem original"]',
    );
    expect(quote).not.toBeNull();

    act(() => quote!.click());
    await flush();

    expect(mocks.toast).toHaveBeenLastCalledWith(
      failure === "missing" ? texts.messages.replyUnavailable : texts.messages.replyNavigationError,
      "error",
    );
  });
});
