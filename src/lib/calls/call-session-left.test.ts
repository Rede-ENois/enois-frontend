// @vitest-environment jsdom
import type { CallView } from "@/types/application/call/call-view";
import { beforeEach, describe, expect, it } from "vitest";

import {
  callInRoom,
  callSessionStore,
  forgetLeftCall,
  getCallSession,
  wasCallLeft,
} from "./call-session";

function call(overrides: Partial<CallView> = {}): CallView {
  return {
    id: "call_1",
    kind: "VIDEO",
    modality: "GROUP",
    conversationId: null,
    groupId: "group_1",
    topicId: null,
    eventId: null,
    initiatorId: "user_a",
    displayName: "Geral",
    state: "ACTIVE",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: "2026-11-03T12:00:05Z",
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 3,
    isInitiator: false,
    myState: "JOINED",
    ...overrides,
  };
}

describe("saída da chamada em grupo", () => {
  beforeEach(() => {
    callSessionStore.idle();
    forgetLeftCall();
  });

  it("sair fecha a tela e deixa a marca da chamada largada", () => {
    const group = call();
    callSessionStore.ring(group, "incoming");
    callSessionStore.markLeft(group.id);
    expect(getCallSession().phase).toBe("idle");
    expect(getCallSession().call).toBeNull();
    // A sala segue ACTIVE no servidor; a marca é o que impede a próxima resposta de reabri-la.
    expect(wasCallLeft(group.id)).toBe(true);
  });

  it("a marca vale só para a chamada que a pessoa largou", () => {
    callSessionStore.markLeft(call().id);
    expect(wasCallLeft("call_1")).toBe(true);
    expect(wasCallLeft("call_2")).toBe(false);
  });

  it("entrar de novo (clique explícito) apaga a marca", () => {
    callSessionStore.markLeft("call_1");
    forgetLeftCall("call_1");
    expect(wasCallLeft("call_1")).toBe(false);
  });

  it("a marca de outra chamada não é apagada por engano", () => {
    callSessionStore.markLeft("call_1");
    forgetLeftCall("call_2");
    expect(wasCallLeft("call_1")).toBe(true);
  });

  it("sair tira a chamada da fila sem apagar as outras", () => {
    const other = call({ id: "call_2", modality: "DIRECT", groupId: null, conversationId: "c2" });
    callSessionStore.ring(call(), "incoming");
    callSessionStore.ring(other, "incoming");
    callSessionStore.markLeft("call_1");
    expect(getCallSession().waiting.map((held) => held.id)).toEqual(["call_2"]);
  });

  it("no grupo a pessoa não conta como estando na sala depois de sair", () => {
    callSessionStore.joining(call());
    expect(callInRoom()?.id).toBe("call_1");
    callSessionStore.markLeft("call_1");
    expect(callInRoom()).toBeNull();
  });

  it("a tela de chamada encerrada não é presença na sala", () => {
    callSessionStore.ended(call({ state: "ENDED" }));
    expect(callInRoom()).toBeNull();
  });
});
