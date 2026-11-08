import type { CallJoin } from "@/types/application/call/call-join";
import type { CallView } from "@/types/application/call/call-view";
import { beforeEach, describe, expect, it } from "vitest";

import { callSessionStore, getCallSession } from "./call-session";

const CALL: CallView = {
  id: "call_1",
  kind: "VIDEO",
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
  expiresAt: "2026-11-03T12:00:40Z",
  participantCount: 0,
  isInitiator: true,
  myState: "INVITED",
};

const JOIN: CallJoin = {
  callId: "call_1",
  kind: "VIDEO",
  modality: "DIRECT",
  host: "https://chamadas.example.test",
  tokenTtlSeconds: 7200,
  room: "sala-1",
  jwt: "token",
  call: { ...CALL, state: "ACTIVE" },
};

describe("callSessionStore", () => {
  beforeEach(() => callSessionStore.idle());

  it("começa parado", () => {
    expect(getCallSession().phase).toBe("idle");
    expect(getCallSession().call).toBeNull();
  });

  it("guardar uma chamada nova nunca herda a credencial anterior", () => {
    callSessionStore.live(JOIN);
    callSessionStore.ring(CALL, "calling");
    const state = getCallSession();
    expect(state.phase).toBe("calling");
    expect(state.join).toBeNull();
    expect(state.needsRejoin).toBe(false);
  });

  it("minimizar esconde o painel sem pedir credencial nova", () => {
    callSessionStore.live(JOIN);
    callSessionStore.minimize();
    expect(getCallSession()).toMatchObject({ phase: "live", minimized: true, needsRejoin: false });
  });

  it("reabrir pede reconexão ao servidor em vez de reusar o token", () => {
    callSessionStore.live(JOIN);
    callSessionStore.minimize();
    callSessionStore.expand();
    expect(getCallSession()).toMatchObject({
      phase: "joining",
      minimized: false,
      needsRejoin: true,
      join: JOIN,
    });
  });

  it("encerrada guarda o motivo e larga a credencial", () => {
    callSessionStore.live(JOIN);
    callSessionStore.ended({ ...CALL, state: "ENDED" });
    expect(getCallSession()).toMatchObject({ phase: "ended", join: null, error: null });
    expect(getCallSession().call?.state).toBe("ENDED");
  });

  it("erro substitui a sala por uma mensagem", () => {
    callSessionStore.live(JOIN);
    callSessionStore.error("sem microfone");
    expect(getCallSession()).toMatchObject({ phase: "error", error: "sem microfone", join: null });
    expect(getCallSession().notConfigured).toBe(false);
  });

  it("aviso de ambiente em configuração é marcado e larga a credencial", () => {
    callSessionStore.live(JOIN);
    callSessionStore.error("Ops, ainda estamos configurando tudo por aqui.", {
      notConfigured: true,
    });
    expect(getCallSession()).toMatchObject({
      phase: "error",
      notConfigured: true,
      join: null,
    });
  });

  it("entrar numa sala limpa o aviso de ambiente em configuração", () => {
    callSessionStore.error("Ops…", { notConfigured: true });
    callSessionStore.joining();
    expect(getCallSession().notConfigured).toBe(false);
  });
});

describe("fila de chamadas", () => {
  const OTHER: CallView = { ...CALL, id: "call_2", displayName: "Bia", isInitiator: false };

  beforeEach(() => callSessionStore.idle());

  it("a segunda chamada não apaga a que está na tela", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    const state = getCallSession();
    expect(state.call?.id).toBe("call_1");
    expect(state.phase).toBe("calling");
    expect(state.waiting.map((held) => held.id)).toEqual(["call_2"]);
  });

  it("a mesma chamada atualiza em vez de entrar na fila", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring({ ...CALL, state: "CONNECTING" }, "calling");
    expect(getCallSession().waiting).toEqual([]);
    expect(getCallSession().call?.state).toBe("CONNECTING");
  });

  it("a fila sobrevive ao fim da chamada da tela", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    callSessionStore.ended({ ...CALL, state: "ENDED" });
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_2"]);
  });

  it("fechar a tela não descarta quem está esperando", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    callSessionStore.idle();
    expect(getCallSession()).toMatchObject({ phase: "idle", call: null });
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_2"]);
  });

  it("a próxima da fila assume a tela quando a de cima termina", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    callSessionStore.ended({ ...CALL, state: "ENDED" });
    const promoted = callSessionStore.promoteWaiting();
    expect(promoted?.id).toBe("call_2");
    expect(getCallSession()).toMatchObject({ phase: "incoming", call: { id: "call_2" } });
    expect(getCallSession().waiting).toEqual([]);
  });

  it("atender uma da fila troca as duas de lugar, sem perder a de cima", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    const swapped = callSessionStore.swapWaiting("call_2");
    expect(swapped?.id).toBe("call_2");
    expect(getCallSession()).toMatchObject({ phase: "incoming", call: { id: "call_2" } });
    // A que estava na tela continua tocando: ninguém a recusou.
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_1"]);
  });

  it("recusar uma da fila só tira ela da fila", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    callSessionStore.removeWaiting("call_2");
    expect(getCallSession()).toMatchObject({ phase: "calling", call: { id: "call_1" } });
    expect(getCallSession().waiting).toEqual([]);
  });

  it("a chamada que terminou sai da fila sozinha", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    callSessionStore.ended({ ...OTHER, state: "MISSED" });
    expect(getCallSession().waiting).toEqual([]);
  });
});
