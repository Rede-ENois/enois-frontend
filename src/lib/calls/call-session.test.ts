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
  host: "8x8.vc",
  tokenTtlSeconds: 7200,
  appId: "app",
  room: "app/sala-1",
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
  });
});
