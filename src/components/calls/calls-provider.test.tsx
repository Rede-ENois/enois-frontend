// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CallView } from "@/types/application/call/call-view";
import type { CallsContextValue } from "@/types/application/call/calls-context-value";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callSessionStore, getCallSession } from "@/lib/calls/call-session";

import { CallsProvider, useCalls } from "./calls-provider";

const mocks = vi.hoisted(() => ({
  open: vi.fn(() => Promise.resolve([] as CallView[])),
  startDirect: vi.fn(),
  ringtone: vi.fn(() => () => {}),
  current: null as CallView | null,
  get: vi.fn(),
  join: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  apiUrl: (path: string) => `/api${path}`,
  callsApi: {
    open: mocks.open,
    startDirect: mocks.startDirect,
    get: mocks.get,
    join: mocks.join,
  },
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));
vi.mock("@/lib/message-stream", () => ({ subscribeToCallEvents: () => () => {} }));
vi.mock("@/lib/lite-mode", () => ({ readEconomicMode: () => false }));
vi.mock("./call-ringtone", () => ({ startRingtone: mocks.ringtone }));
vi.mock("./call-panel", () => ({ CallPanel: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Deixa as promessas pendentes resolverem. Com relógio falso, avança 0 ms — que também esvazia a
 * fila de microtarefas, sem esperar tempo real.
 */
const flush = () =>
  act(async () => {
    if (vi.isFakeTimers()) {
      await vi.advanceTimersByTimeAsync(0);
      return;
    }
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

/** As ações ativas publicadas pelo provider, para o teste clicar em "entrar" como a tela faz. */
const actions: { current: CallsContextValue | null } = { current: null };

function CaptureActions() {
  actions.current = useCalls();
  return null;
}

describe("toque da chamada", () => {
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    mocks.ringtone.mockClear();
    mocks.open.mockClear();
    mocks.get.mockReset();
    mocks.get.mockImplementation(() => Promise.resolve(mocks.current));
    mocks.join.mockReset();
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
            <CaptureActions />

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
    actions.current = null;
    vi.useRealTimers();
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

  it("entrada recusada por limite não é repetida sozinha pela conferência", async () => {
    const { ApiError } = await import("@/lib/api-client");
    const live = call({
      modality: "GROUP",
      conversationId: null,
      groupId: "grupo_1",
      state: "ACTIVE",
      participantCount: 1,
    });
    mocks.current = live;
    mocks.join.mockRejectedValue(
      new ApiError(429, "RATE_LIMITED", "Muitas requisicoes. Tente novamente em instantes."),
    );

    vi.useFakeTimers();
    act(() => callSessionStore.ring(live, "calling"));
    await flush();

    // Uma entrada, uma recusa. Antes, cada resposta do servidor reabria a entrada e a tela
    // alternava entre o estado da sala e o aviso de limite várias vezes por segundo.
    expect(mocks.join.mock.calls.length).toBe(1);
    expect(getCallSession()).toMatchObject({ phase: "error" });

    // Avança o relógio por três ciclos de conferência: a falha não pode disparar entrada nova.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000);
    });
    expect(mocks.join.mock.calls.length).toBe(1);
    expect(getCallSession()).toMatchObject({ phase: "error" });
  });

  it("quem está de fora e clica em entrar pede a credencial uma vez e entra", async () => {
    const live = call({
      modality: "GROUP",
      conversationId: null,
      groupId: "grupo_1",
      state: "ACTIVE",
      participantCount: 1,
    });
    mocks.current = live;
    mocks.join.mockResolvedValue({
      call: live,
      host: "https://meet.exemplo",
      roomId: "sala_1",
      appId: "app",
      jwt: "token",
      tokenTtlSeconds: 3600,
    });

    vi.useFakeTimers();
    await flush();
    act(() => {
      void actions.current?.open(live.id);
    });
    await flush();

    // Entrou: uma única credencial foi pedida, e a tela está na sala em vez de ficar no aviso.
    expect(mocks.join.mock.calls.length).toBe(1);
    expect(getCallSession()).toMatchObject({ phase: "live", call: { id: live.id } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000);
    });
    expect(mocks.join.mock.calls.length).toBe(1);
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
