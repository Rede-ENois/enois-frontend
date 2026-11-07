// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CallView } from "@/types/application/call/call-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callSessionStore, getCallSession } from "@/lib/calls/call-session";

import { CallsProvider, useCalls } from "./calls-provider";

const mocks = vi.hoisted(() => ({
  open: vi.fn(() => Promise.resolve([] as CallView[])),
  startDirect: vi.fn(),
  ringtone: vi.fn(() => () => {}),
  current: null as CallView | null,
}));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  apiUrl: (path: string) => `/api${path}`,
  callsApi: {
    open: mocks.open,
    startDirect: mocks.startDirect,
    // A conferência periódica só lê a chamada; devolver a mesma evita efeito colateral no teste.
    get: vi.fn(() => Promise.resolve(mocks.current)),
    join: vi.fn(),
  },
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));
vi.mock("@/lib/message-stream", () => ({ subscribeToCallEvents: () => () => {} }));
vi.mock("@/lib/lite-mode", () => ({ readEconomicMode: () => false }));
vi.mock("./call-ringtone", () => ({ startRingtone: mocks.ringtone }));
vi.mock("./call-panel", () => ({ CallPanel: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

function call(overrides: Partial<CallView>): CallView {
  return {
    id: "call_1",
    kind: "AUDIO",
    modality: "DIRECT",
    conversationId: "conv_1",
    groupId: null,
    topicId: null,
    initiatorId: "user_a",
    displayName: "Ana",
    state: "RINGING",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: null,
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 0,
    isInitiator: false,
    myState: "INVITED",
    ...overrides,
  };
}

describe("toque da chamada", () => {
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    mocks.ringtone.mockClear();
    mocks.open.mockClear();
    mocks.current = null;
    callSessionStore.idle();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>
            <p>conteúdo</p>
          </CallsProvider>
        </QueryClientProvider>,
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    callSessionStore.idle();
  });

  it("toca quando recebo uma chamada 1:1", async () => {
    await flush();
    act(() => callSessionStore.ring(call({}), "incoming"));
    await flush();
    expect(mocks.ringtone).toHaveBeenCalledTimes(1);
    expect(getCallSession()).toMatchObject({ phase: "incoming", call: { id: "call_1" } });
  });

  it("nunca toca no 'Tamo junto' (grupo)", async () => {
    await flush();
    act(() =>
      callSessionStore.ring(
        call({ modality: "GROUP", conversationId: null, groupId: "grupo_1" }),
        "incoming",
      ),
    );
    await flush();
    expect(mocks.ringtone).not.toHaveBeenCalled();
  });

  it("não toca na chamada que eu mesmo fiz", async () => {
    await flush();
    act(() => callSessionStore.ring(call({ isInitiator: true }), "calling"));
    await flush();
    expect(mocks.ringtone).not.toHaveBeenCalled();
  });

  it("ligar sem servidor de chamadas configurado mostra o aviso, não um erro seco", async () => {
    const { ApiError } = await import("@/lib/api-client");
    mocks.startDirect.mockRejectedValueOnce(
      new ApiError(503, "CALLS_NOT_CONFIGURED", "As chamadas ainda nao estao configuradas."),
    );
    act(() => root.unmount());
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    function Harness() {
      const calls = useCalls();
      return (
        <button type="button" onClick={() => void calls.startDirect("conv_1", "AUDIO")}>
          ligar
        </button>
      );
    }

    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>
            <Harness />
          </CallsProvider>
        </QueryClientProvider>,
      );
    });
    await flush();
    const button = host.querySelector("button");
    act(() => button!.click());
    await flush();

    expect(getCallSession()).toMatchObject({
      phase: "error",
      notConfigured: true,
      error: "Ops, ainda estamos configurando tudo por aqui.",
      join: null,
    });
  });

  it("retoma ao abrir o app a chamada 1:1 que ficou tocando", async () => {
    // A retomada acontece na montagem: a montagem do beforeEach já rodou, então refazemos aqui.
    act(() => root.unmount());
    const waiting = call({ id: "call_2" });
    mocks.current = waiting;
    mocks.open.mockResolvedValue([waiting]);
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>
            <p>conteúdo</p>
          </CallsProvider>
        </QueryClientProvider>,
      );
    });
    await flush();
    expect(mocks.ringtone).toHaveBeenCalledTimes(1);
    expect(getCallSession().call?.id).toBe("call_2");
    mocks.open.mockResolvedValue([]);
  });
});
