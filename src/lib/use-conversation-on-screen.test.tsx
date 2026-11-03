// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VIEWING_HEARTBEAT_MS, useConversationOnScreen } from "./use-conversation-on-screen";

const mocks = vi.hoisted(() => ({
  viewing: vi.fn(),
  leftConversation: vi.fn(),
  markAsRead: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ messagesApi: mocks }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ args }: { args: Parameters<typeof useConversationOnScreen> }) {
  useConversationOnScreen(...args);
  return null;
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await Promise.resolve();
  });

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("conversa aberta na tela", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    for (const mock of Object.values(mocks)) mock.mockReset().mockResolvedValue(undefined);
    setVisibility("visible");
    host = document.createElement("div");
    document.body.appendChild(host);
    client = new QueryClient();
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    vi.useRealTimers();
  });

  const render = async (...args: Parameters<typeof useConversationOnScreen>) => {
    await act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe args={args} />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("avisa o servidor enquanto a conversa está na tela e quando ela sai", async () => {
    await render("c1", 0, null);
    expect(mocks.viewing).toHaveBeenCalledTimes(1);
    expect(mocks.viewing).toHaveBeenCalledWith("c1");

    await act(async () => vi.advanceTimersByTime(VIEWING_HEARTBEAT_MS));
    expect(mocks.viewing).toHaveBeenCalledTimes(2);

    await render("c2", 0, null);
    expect(mocks.leftConversation).toHaveBeenCalledWith("c1");
    expect(mocks.viewing).toHaveBeenLastCalledWith("c2");
  });

  it("aba no fundo deixa de contar como na tela e volta ao reaparecer", async () => {
    await render("c1", 0, null);
    await act(async () => setVisibility("hidden"));
    expect(mocks.leftConversation).toHaveBeenCalledWith("c1");

    await act(async () => vi.advanceTimersByTime(VIEWING_HEARTBEAT_MS * 2));
    expect(mocks.viewing).toHaveBeenCalledTimes(1);

    await act(async () => setVisibility("visible"));
    expect(mocks.viewing).toHaveBeenCalledTimes(2);
  });

  it("marca como lida ao abrir com não lidas e quando chega mensagem com ela na tela", async () => {
    await render("c1", 2, "m2");
    expect(mocks.markAsRead).toHaveBeenCalledTimes(1);

    // Server answered: nothing unread, same last message, so no new call.
    await render("c1", 0, "m2");
    expect(mocks.markAsRead).toHaveBeenCalledTimes(1);

    await render("c1", 0, "m3");
    expect(mocks.markAsRead).toHaveBeenCalledTimes(2);
  });

  it("não marca como lida a conversa já lida, nem enquanto as mensagens carregam", async () => {
    await render("c1", 0, undefined);
    await render("c1", 0, "m1");
    expect(mocks.markAsRead).not.toHaveBeenCalled();
  });

  it("com a aba no fundo, mensagem nova não é marcada como lida", async () => {
    setVisibility("hidden");
    await render("c1", 1, "m1");
    expect(mocks.markAsRead).not.toHaveBeenCalled();
    expect(mocks.viewing).not.toHaveBeenCalled();
  });
});
