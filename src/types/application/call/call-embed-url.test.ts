import { describe, expect, it } from "vitest";

import { callEmbedUrl } from "./call-embed-url";
import type { CallJoin } from "./call-join";

const JOIN: CallJoin = {
  callId: "call_1",
  kind: "AUDIO",
  modality: "DIRECT",
  host: "8x8.vc",
  tokenTtlSeconds: 7200,
  appId: "app",
  room: "app/sala-sem-nome-deusuario",
  jwt: "token.assinado",
  call: {
    id: "call_1",
    kind: "AUDIO",
    modality: "DIRECT",
    conversationId: "conv",
    groupId: null,
    initiatorId: "u1",
    displayName: "Ana",
    state: "ACTIVE",
    createdAt: "2026-11-03T12:00:00Z",
    answeredAt: null,
    endedAt: null,
    endReason: null,
    expiresAt: null,
    participantCount: 2,
    isInitiator: true,
    myState: "JOINED",
  },
};

describe("callEmbedUrl", () => {
  it("leva a sala e o token que o servidor assinou", () => {
    const url = new URL(callEmbedUrl(JOIN));
    expect(url.origin).toBe("https://8x8.vc");
    expect(url.pathname).toBe("/app/sala-sem-nome-deusuario");
    expect(url.searchParams.get("jwt")).toBe("token.assinado");
  });

  it("chamada de áudio abre sem vídeo; chamada de vídeo abre com vídeo", () => {
    const audio = new URL(callEmbedUrl(JOIN));
    expect(audio.searchParams.get("config.startAudioOnly")).toBe("true");
    expect(audio.searchParams.get("config.startWithVideoMuted")).toBe("true");
    const video = new URL(callEmbedUrl({ ...JOIN, kind: "VIDEO" }));
    expect(video.searchParams.get("config.startAudioOnly")).toBe("false");
  });

  it("sem tela de entrada e sem deep link: nada de sair do app", () => {
    const url = new URL(callEmbedUrl(JOIN));
    expect(url.searchParams.get("config.prejoinPageEnabled")).toBe("false");
    expect(url.searchParams.get("config.disableDeepLinking")).toBe("true");
  });

  it("o endereço não carrega a sessão da pessoa", () => {
    expect(callEmbedUrl(JOIN)).not.toMatch(/session|password|senha/i);
  });
});
