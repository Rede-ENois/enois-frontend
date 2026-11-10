import type { CallJoin } from "@/types/application/call/call-join";
import type { CallView } from "@/types/application/call/call-view";
import { beforeEach, describe, expect, it } from "vitest";

import { MAX_WAITING, callSessionStore, getCallSession } from "./call-session";

const CALL: CallView = {
  id: "call_1",
  kind: "VIDEO",
  modality: "DIRECT",
  conversationId: "conv_1",
  groupId: null,
  topicId: null,
  eventId: null,
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
  host: "https://meet.enois.ia.br",
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

  it("reabrir preserva a sessão e a credencial da sala montada", () => {
    callSessionStore.live(JOIN);
    callSessionStore.minimize();
    callSessionStore.expand();
    expect(getCallSession()).toMatchObject({
      phase: "live",
      minimized: false,
      needsRejoin: false,
      needsCredential: false,
      join: JOIN,
    });
  });

  it("expandir durante a recuperação preserva o pedido pendente", () => {
    callSessionStore.live(JOIN);
    callSessionStore.minimize();
    callSessionStore.lostCredential();
    callSessionStore.expand();
    expect(getCallSession()).toMatchObject({
      phase: "joining",
      minimized: false,
      needsRejoin: true,
      needsCredential: true,
    });
  });

  it("expandir após o fim não reabre a chamada", () => {
    callSessionStore.live(JOIN);
    callSessionStore.minimize();
    callSessionStore.ended({ ...CALL, state: "ENDED" });
    callSessionStore.expand();
    expect(getCallSession()).toMatchObject({
      phase: "ended",
      minimized: false,
      join: null,
      needsCredential: false,
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

  // `idle` mantém a fila de propósito; cada teste começa sem ninguém esperando.
  beforeEach(() => {
    getCallSession().waiting.forEach((held) => callSessionStore.removeWaiting(held.id));
    callSessionStore.idle();
  });

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
    expect(swapped?.next.id).toBe("call_2");
    expect(swapped?.left).toBeNull();
    expect(getCallSession()).toMatchObject({ phase: "incoming", call: { id: "call_2" } });
    // A que estava na tela continua tocando: ninguém a recusou.
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_1"]);
  });

  it("atender uma da fila no meio de uma ligação larga a sala em vez de devolvê-la à fila", () => {
    callSessionStore.live(JOIN);
    callSessionStore.ring(OTHER, "incoming");
    const swapped = callSessionStore.swapWaiting("call_2");
    // Quem chamou a troca precisa avisar o servidor que a pessoa saiu desta sala.
    expect(swapped?.left?.id).toBe("call_1");
    expect(getCallSession()).toMatchObject({
      phase: "incoming",
      call: { id: "call_2" },
      join: null,
    });
    expect(getCallSession().waiting).toEqual([]);
  });

  it("entrando na sala também conta como estar nela", () => {
    callSessionStore.joining({ ...CALL, state: "ACTIVE" });
    callSessionStore.ring(OTHER, "incoming");
    expect(callSessionStore.swapWaiting("call_2")?.left?.id).toBe("call_1");
    expect(getCallSession().waiting).toEqual([]);
  });

  it("a fila guarda no máximo cinco chamadas", () => {
    callSessionStore.ring(CALL, "calling");
    for (let index = 0; index < MAX_WAITING + 2; index += 1) {
      callSessionStore.ring({ ...OTHER, id: `fila_${index}` }, "incoming");
    }
    expect(getCallSession().waiting.map((held) => held.id)).toEqual([
      "fila_0",
      "fila_1",
      "fila_2",
      "fila_3",
      "fila_4",
    ]);
    // A mesma chamada tocando de novo não conta como mais uma.
    callSessionStore.ring({ ...OTHER, id: "fila_0" }, "incoming");
    expect(getCallSession().waiting).toHaveLength(MAX_WAITING);
  });

  it("estado novo de uma chamada da fila não mexe na de cima", () => {
    callSessionStore.ring(CALL, "calling");
    callSessionStore.ring(OTHER, "incoming");
    callSessionStore.updateWaiting({ ...OTHER, participantCount: 3 });
    expect(getCallSession().call?.id).toBe("call_1");
    expect(getCallSession().waiting[0]?.participantCount).toBe(3);
    // Quem não está na fila não entra nela por atualização.
    callSessionStore.updateWaiting({ ...OTHER, id: "estranha" });
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_2"]);
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
