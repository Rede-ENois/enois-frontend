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
  answer: vi.fn(),
  decline: vi.fn(),
  end: vi.fn<(callId: string) => Promise<void>>(() => Promise.resolve()),
  cancel: vi.fn<(callId: string) => Promise<void>>(() => Promise.resolve()),
  leave: vi.fn<(callId: string) => Promise<void>>(() => Promise.resolve()),
  onCallEvent: null as ((callId: string) => void) | null,
}));

vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  apiUrl: (path: string) => `/api${path}`,
  callsApi: {
    open: mocks.open,
    startDirect: mocks.startDirect,
    get: mocks.get,
    join: mocks.join,
    answer: mocks.answer,
    decline: mocks.decline,
    end: mocks.end,
    cancel: mocks.cancel,
    leave: mocks.leave,
  },
}));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => true }));
vi.mock("@/lib/require-auth", () => ({ hasSession: () => true }));
vi.mock("@/lib/message-stream", () => ({
  subscribeToCallEvents: (listener: (callId: string) => void) => {
    mocks.onCallEvent = listener;
    return () => {
      if (mocks.onCallEvent === listener) mocks.onCallEvent = null;
    };
  },
}));
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

/** `idle()` preserva a fila de propósito; para um teste, comece do zero de verdade. */
function clearSession() {
  callSessionStore.idle();
  for (const held of [...getCallSession().waiting]) callSessionStore.removeWaiting(held.id);
}

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
    mocks.answer.mockReset();
    mocks.decline.mockReset();
    mocks.current = null;
    clearSession();
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
    clearSession();
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
      host: "https://meet.enois.ia.br",
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

describe("fila de chamadas no provider", () => {
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    mocks.ringtone.mockClear();
    mocks.open.mockClear();
    mocks.open.mockResolvedValue([]);
    mocks.get.mockReset();
    mocks.get.mockImplementation(() => Promise.resolve(mocks.current));
    mocks.join.mockReset();
    mocks.answer.mockReset();
    mocks.decline.mockReset();
    mocks.current = null;
    clearSession();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>
            <CaptureActions />
          </CallsProvider>
        </QueryClientProvider>,
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    clearSession();
    actions.current = null;
    vi.useRealTimers();
  });

  it("a segunda chamada não tira a primeira da tela", async () => {
    await flush();
    act(() => callSessionStore.ring(call({}), "incoming"));
    await flush();
    act(() => callSessionStore.ring(call({ id: "call_2", displayName: "Bia" }), "incoming"));
    await flush();
    expect(getCallSession().call?.id).toBe("call_1");
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_2"]);
  });

  it("a chamada da fila assume a tela quando a de cima termina", async () => {
    await flush();
    act(() => callSessionStore.ring(call({}), "incoming"));
    await flush();
    act(() => callSessionStore.ring(call({ id: "call_2", displayName: "Bia" }), "incoming"));
    await flush();

    mocks.current = call({ id: "call_2", displayName: "Bia" });
    act(() => callSessionStore.ended(call({ state: "ENDED" })));
    await flush();

    expect(getCallSession().call?.id).toBe("call_2");
    expect(getCallSession().phase).toBe("incoming");
    expect(getCallSession().waiting).toEqual([]);
  });

  it("recusar a chamada da fila não fecha a que está na tela", async () => {
    await flush();
    act(() => callSessionStore.ring(call({}), "incoming"));
    await flush();
    act(() => callSessionStore.ring(call({ id: "call_2", displayName: "Bia" }), "incoming"));
    await flush();

    await act(async () => {
      await actions.current?.decline("call_2");
    });

    expect(mocks.decline).toHaveBeenCalledWith("call_2");
    expect(getCallSession().call?.id).toBe("call_1");
    expect(getCallSession().waiting).toEqual([]);
  });

  it("atender a chamada da fila põe ela na tela e devolve a de cima para a fila", async () => {
    await flush();
    act(() => callSessionStore.ring(call({}), "incoming"));
    await flush();
    act(() => callSessionStore.ring(call({ id: "call_2", displayName: "Bia" }), "incoming"));
    await flush();

    const answered = call({ id: "call_2", displayName: "Bia", state: "CONNECTING" });
    mocks.answer.mockResolvedValue(answered);
    mocks.join.mockResolvedValue({
      call: { ...answered, state: "ACTIVE" },
      host: "https://meet.enois.ia.br",
      roomId: "sala_2",
      appId: "app",
      jwt: "token",
      tokenTtlSeconds: 3600,
    });

    await act(async () => {
      await actions.current?.answer("call_2");
    });
    await flush();

    expect(mocks.answer).toHaveBeenCalledWith("call_2");
    expect(getCallSession().call?.id).toBe("call_2");
    // A que estava na tela continua tocando: ninguém a recusou.
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_1"]);
  });
});

describe("filas e toque", () => {
  it("a 1:1 esperando atrás de uma chamada em grupo também toca", async () => {
    clearSession();
    const live = call({
      modality: "GROUP",
      conversationId: null,
      groupId: "grupo_1",
      state: "ACTIVE",
    });
    mocks.get.mockReset();
    mocks.get.mockImplementation(() => Promise.resolve(live));
    mocks.ringtone.mockClear();
    const host = document.createElement("div");
    document.body.append(host);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const root = createRoot(host);
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>
            <CaptureActions />
          </CallsProvider>
        </QueryClientProvider>,
      );
    });
    await flush();

    // Chamada de grupo na tela (não toca) e uma 1:1 chegando atrás dela.
    act(() => callSessionStore.ring(live, "calling"));
    await flush();
    expect(mocks.ringtone).not.toHaveBeenCalled();

    act(() => callSessionStore.ring(call({ id: "call_2", displayName: "Bia" }), "incoming"));
    await flush();
    expect(mocks.ringtone).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
    document.body.innerHTML = "";
    clearSession();
  });
});

describe("revisão da fila: sala, toque e eventos fora de ordem", () => {
  let root: Root;
  let client: QueryClient;
  const byId = new Map<string, CallView>();

  const joinFor = (target: CallView, host = "https://meet.enois.ia.br") => ({
    callId: target.id,
    kind: target.kind,
    modality: target.modality,
    call: { ...target, state: "ACTIVE" as const },
    host,
    room: `sala_${target.id}`,
    jwt: `token_${target.id}`,
    tokenTtlSeconds: 3600,
  });

  beforeEach(() => {
    byId.clear();
    mocks.ringtone.mockClear();
    mocks.open.mockResolvedValue([]);
    mocks.get.mockReset();
    mocks.get.mockImplementation((id: string) =>
      byId.has(id) ? Promise.resolve(byId.get(id)) : Promise.reject(new Error("sem chamada")),
    );
    mocks.join.mockReset();
    mocks.answer.mockReset();
    mocks.decline.mockReset();
    mocks.end.mockClear();
    mocks.cancel.mockClear();
    mocks.leave.mockClear();
    clearSession();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <CallsProvider>
            <CaptureActions />
          </CallsProvider>
        </QueryClientProvider>,
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = "";
    clearSession();
    actions.current = null;
  });

  /** Põe a pessoa dentro da sala da call_1 com a call_2 (1:1) tocando na fila. */
  async function liveWithQueued() {
    const live = call({ state: "ACTIVE" });
    const queued = call({ id: "call_2", displayName: "Bia" });
    byId.set(live.id, live);
    byId.set(queued.id, queued);
    await flush();
    act(() => callSessionStore.live(joinFor(live)));
    act(() => callSessionStore.ring(queued, "incoming"));
    await flush();
    return { live, queued };
  }

  it("não toca enquanto a pessoa está na sala, mesmo com uma 1:1 na fila", async () => {
    await liveWithQueued();
    expect(getCallSession().phase).toBe("live");
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_2"]);
    expect(mocks.ringtone).not.toHaveBeenCalled();
  });

  it("não toca enquanto a entrada na sala está a caminho", async () => {
    await flush();
    act(() => callSessionStore.joining(call({ state: "ACTIVE" })));
    act(() => callSessionStore.ring(call({ id: "call_2", displayName: "Bia" }), "incoming"));
    await flush();
    expect(mocks.ringtone).not.toHaveBeenCalled();
  });

  it("atender a da fila no meio da ligação avisa o servidor que a pessoa saiu da sala", async () => {
    const { queued } = await liveWithQueued();
    const order: string[] = [];
    mocks.leave.mockImplementation(async (id: string) => {
      order.push(`leave:${id}`);
    });
    mocks.answer.mockImplementation(async (id: string) => {
      order.push(`answer:${id}`);
      return { ...queued, state: "CONNECTING" };
    });
    mocks.join.mockResolvedValue(joinFor(queued));

    await act(async () => {
      await actions.current?.answer("call_2");
    });
    await flush();

    expect(order).toEqual(["leave:call_1", "answer:call_2"]);
    expect(getCallSession()).toMatchObject({ phase: "live", call: { id: "call_2" } });
    // A sala largada não volta para a fila.
    expect(getCallSession().waiting).toEqual([]);
  });

  it("evento da chamada anterior durante a troca não toma a tela", async () => {
    await flush();
    const first = call({});
    const second = call({ id: "call_2", displayName: "Bia" });
    byId.set(first.id, first);
    byId.set(second.id, second);
    act(() => callSessionStore.ring(first, "incoming"));
    act(() => callSessionStore.ring(second, "incoming"));
    await flush();

    // O atendimento fica pendurado: é a janela entre a troca e a entrada na sala.
    let release: (value: CallView) => void = () => {};
    mocks.answer.mockImplementation(
      () =>
        new Promise<CallView>((resolve) => {
          release = resolve;
        }),
    );
    mocks.join.mockResolvedValue(joinFor(second));
    let answering: Promise<void> | undefined;
    act(() => {
      answering = actions.current?.answer("call_2");
    });
    await flush();
    expect(getCallSession().call?.id).toBe("call_2");

    // Chega um evento da call_1 (que voltou para a fila).
    byId.set(first.id, { ...first, participantCount: 2 });
    act(() => mocks.onCallEvent?.("call_1"));
    await flush();

    expect(getCallSession().call?.id).toBe("call_2");
    expect(getCallSession().waiting).toEqual([{ ...first, participantCount: 2 }]);
    expect(mocks.join).not.toHaveBeenCalledWith("call_1");

    await act(async () => {
      release({ ...second, state: "CONNECTING" });
      await answering;
    });
    expect(getCallSession()).toMatchObject({ phase: "live", call: { id: "call_2" } });
  });

  it("largar a sala avisa a saída com leave, que também apaga a presença no grupo", async () => {
    const live = call({
      modality: "GROUP",
      conversationId: null,
      groupId: "grupo_1",
      state: "ACTIVE",
    });
    const queued = call({ id: "call_2", displayName: "Bia", modality: "GROUP", isInitiator: true });
    byId.set(live.id, live);
    byId.set(queued.id, queued);
    await flush();
    act(() => callSessionStore.live(joinFor(live)));
    act(() => callSessionStore.ring(queued, "calling"));
    await flush();

    mocks.answer.mockResolvedValue({ ...queued, state: "CONNECTING" });
    mocks.join.mockRejectedValue(new Error("rede fora"));
    await act(async () => {
      await actions.current?.answer("call_2");
    });
    await flush();

    expect(mocks.leave).toHaveBeenCalledWith("call_1");
    expect(mocks.end).not.toHaveBeenCalled();
  });

  it("atender da fila com falha no servidor avisa a saída da chamada atendida", async () => {
    const { queued } = await liveWithQueued();
    // O servidor deu a chamada por atendida, mas a credencial da sala não veio.
    mocks.answer.mockResolvedValue({ ...queued, state: "ACTIVE" });
    mocks.join.mockRejectedValue(new Error("rede fora"));
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "https://enois.ia.br/" },
    });

    await act(async () => {
      await actions.current?.answer("call_2");
    });
    await flush();

    expect(mocks.leave).toHaveBeenCalledWith("call_1");
    expect(mocks.leave).toHaveBeenCalledWith("call_2");
    expect(getCallSession().phase).toBe("error");
  });

  it("host fora do servidor de reunião avisa a saída em vez de deixar a chamada presa", async () => {
    const target = call({ state: "RINGING" });
    byId.set(target.id, target);
    await flush();
    act(() => callSessionStore.ring(target, "incoming"));
    mocks.answer.mockResolvedValue({ ...target, state: "CONNECTING" });
    mocks.join.mockResolvedValue(joinFor(target, "https://sala-de-outra-pessoa.example"));

    await act(async () => {
      await actions.current?.answer();
    });
    await flush();

    expect(mocks.leave).toHaveBeenCalledWith("call_1");
    expect(getCallSession()).toMatchObject({
      phase: "error",
      error: expect.stringContaining("servidor de chamadas"),
    });
  });

  it("chamada da fila que terminou no servidor sai da fila sem mexer na tela", async () => {
    await flush();
    const first = call({});
    const second = call({ id: "call_2", displayName: "Bia" });
    byId.set(first.id, first);
    act(() => callSessionStore.ring(first, "incoming"));
    act(() => callSessionStore.ring(second, "incoming"));
    await flush();

    byId.set(second.id, { ...second, state: "CANCELLED" });
    act(() => mocks.onCallEvent?.("call_2"));
    await flush();

    expect(getCallSession()).toMatchObject({ phase: "incoming", call: { id: "call_1" } });
    expect(getCallSession().waiting).toEqual([]);
  });

  it("credencial apontando para outro servidor de reunião não abre a sala", async () => {
    const live = call({ state: "ACTIVE" });
    byId.set(live.id, live);
    mocks.join.mockResolvedValue(joinFor(live, "https://outro-servidor.example"));
    await flush();

    await act(async () => {
      await actions.current?.open(live.id);
    });

    expect(getCallSession()).toMatchObject({
      phase: "error",
      join: null,
      error: "Esta sala não está no nosso servidor de chamadas, então ela não foi aberta.",
    });
  });
});
