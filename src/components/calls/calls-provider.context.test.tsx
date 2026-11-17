// @vitest-environment jsdom
import { act, useEffect } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CallView } from "@/types/application/call/call-view";
import type { CallsContextValue } from "@/types/application/call/calls-context-value";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callSessionStore, forgetLeftCall, getCallSession } from "@/lib/calls/call-session";

import { CallsProvider, useCalls } from "./calls-provider";

const mocks = vi.hoisted(() => ({
  authenticated: true,
  open: vi.fn(),
  get: vi.fn(),
  startDirect: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  callsApi: {
    open: mocks.open,
    get: mocks.get,
    startDirect: mocks.startDirect,
  },
}));
vi.mock("@/lib/use-auth", () => ({
  useIsAuthenticated: () => mocks.authenticated,
}));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));
vi.mock("@/lib/message-stream", () => ({
  subscribeToCallEvents: () => () => {},
}));
vi.mock("@/lib/lite-mode", () => ({ readEconomicMode: () => false }));
vi.mock("./call-ringtone", () => ({ startRingtone: () => () => {} }));
vi.mock("./call-panel", () => ({ CallPanel: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CALL: CallView = {
  id: "call_context",
  kind: "AUDIO",
  modality: "DIRECT",
  conversationId: "conv_context",
  groupId: null,
  topicId: null,
  eventId: null,
  initiatorId: "user_context",
  displayName: "Chamada de teste",
  state: "RINGING",
  createdAt: "2024-01-01T12:00:00Z",
  answeredAt: null,
  endedAt: null,
  endReason: null,
  expiresAt: null,
  participantCount: 0,
  isInitiator: true,
  myState: "INVITED",
};

const actions: { current: CallsContextValue | null } = { current: null };
let mounts = 0;

function Consumer() {
  actions.current = useCalls();
  useEffect(() => {
    mounts += 1;
  }, []);
  return null;
}

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("contexto de chamadas", () => {
  let root: Root;
  let client: QueryClient;
  let host: HTMLDivElement;

  function renderProvider() {
    root.render(
      <QueryClientProvider client={client}>
        <CallsProvider>
          <Consumer />
        </CallsProvider>
      </QueryClientProvider>,
    );
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.authenticated = true;
    mocks.open.mockResolvedValue([]);
    mocks.get.mockImplementation(async (id: string) => ({ ...CALL, id }));
    mocks.startDirect.mockResolvedValue(CALL);
    getCallSession().waiting.forEach((held) => callSessionStore.removeWaiting(held.id));
    callSessionStore.idle();
    forgetLeftCall();
    actions.current = null;
    mounts = 0;
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(renderProvider);
    await flush();
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
    callSessionStore.idle();
    forgetLeftCall();
    actions.current = null;
  });

  it("entrega as ações reais na primeira montagem com sessão", async () => {
    await act(async () => {
      await actions.current!.startDirect(CALL.conversationId!, CALL.kind);
    });

    expect(mocks.startDirect).toHaveBeenCalledExactlyOnceWith(CALL.conversationId, CALL.kind);
    expect(actions.current?.call).toEqual(CALL);
  });

  it("publica mudanças da chamada sem precisar renderizar o pai", () => {
    const next = { ...CALL, id: "call_context_next" };

    act(() => callSessionStore.ring(next, "calling"));

    expect(actions.current?.call).toEqual(next);
  });

  it("preserva o filho na hidratação e ao sair da sessão", async () => {
    expect(mounts).toBe(1);

    mocks.authenticated = false;
    act(renderProvider);

    expect(mounts).toBe(1);
    expect(actions.current?.call).toBeNull();

    await act(async () => {
      await actions.current!.startDirect(CALL.conversationId!, CALL.kind);
    });

    expect(mocks.startDirect).not.toHaveBeenCalled();
    expect(mocks.open).toHaveBeenCalledTimes(1);
  });
});
