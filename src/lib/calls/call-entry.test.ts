import type { CallView } from "@/types/application/call/call-view";
import { describe, expect, it } from "vitest";

import { shouldAutoEnter } from "./call-entry";

function call(overrides: Partial<CallView> = {}): CallView {
  return {
    id: "call_1",
    kind: "VIDEO",
    modality: "DIRECT",
    conversationId: "conv_1",
    groupId: null,
    topicId: null,
    initiatorId: "user_a",
    displayName: "Ana",
    state: "ACTIVE",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: "2026-11-03T12:00:05Z",
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 2,
    isInitiator: false,
    myState: "JOINED",
    ...overrides,
  };
}

describe("quem puxa a pessoa para a sala", () => {
  it("o 1:1 ativo abre a sala em quem está livre", () => {
    expect(shouldAutoEnter(call(), "idle", false)).toBe(true);
  });

  it("o Tamo junto nunca abre sozinho, nem com a pessoa livre", () => {
    // A saída de um participante não encerra a sala: ela segue ACTIVE para os outros. Era por
    // aqui que cada aviso do servidor reabria o grupo que a pessoa tinha acabado de fechar.
    const group = call({ modality: "GROUP", conversationId: null, groupId: "group_1" });
    expect(shouldAutoEnter(group, "idle", false)).toBe(false);
    expect(shouldAutoEnter(group, "ended", false)).toBe(false);
  });

  it("chamada largada não volta, nem no 1:1", () => {
    expect(shouldAutoEnter(call(), "idle", true)).toBe(false);
  });

  it("entrando, ao vivo ou num erro que espera clique, não abre outra entrada", () => {
    for (const phase of ["live", "joining", "error"] as const) {
      expect(shouldAutoEnter(call(), phase, false), phase).toBe(false);
    }
  });

  it("chamada que ainda toca ou já terminou não vira sala", () => {
    expect(shouldAutoEnter(call({ state: "RINGING" }), "idle", false)).toBe(false);
    expect(shouldAutoEnter(call({ state: "ENDED" }), "idle", false)).toBe(false);
    expect(shouldAutoEnter(call({ state: "MISSED" }), "idle", false)).toBe(false);
  });

  it("chamada em conexão ainda entra: quem atende precisa ver a sala abrir", () => {
    expect(shouldAutoEnter(call({ state: "CONNECTING" }), "idle", false)).toBe(true);
  });
});
