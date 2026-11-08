import { describe, expect, it } from "vitest";

import { callEmbedHash, callEmbedUrl, isTrustedCallHost } from "./call-embed-url";
import type { CallJoin } from "./call-join";

const JOIN: CallJoin = {
  callId: "call_1",
  kind: "AUDIO",
  modality: "DIRECT",
  host: "https://meet.enois.ia.br",
  tokenTtlSeconds: 7200,
  room: "sala-sem-nome-deusuario",
  jwt: "token.assinado",
  call: {
    id: "call_1",
    kind: "AUDIO",
    modality: "DIRECT",
    conversationId: "conv",
    groupId: null,
    topicId: null,
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

/** O que o Epapo lê da barra da URL: `setConfigFromURLParams` só olha o `#`. */
function hashParams(join: CallJoin): URLSearchParams {
  return new URLSearchParams(callEmbedHash(join).slice(1));
}

describe("callEmbedUrl", () => {
  it("leva a sala e o token que o servidor assinou", () => {
    const url = new URL(callEmbedUrl(JOIN));
    expect(url.origin).toBe("https://meet.enois.ia.br");
    expect(url.pathname).toBe("/sala-sem-nome-deusuario");
    expect(url.searchParams.get("jwt")).toBe("token.assinado");
  });

  it("chamada de áudio abre sem vídeo; chamada de vídeo abre com vídeo", () => {
    expect(hashParams(JOIN).get("config.startWithVideoMuted")).toBe("true");
    expect(hashParams({ ...JOIN, kind: "VIDEO" }).get("config.startWithVideoMuted")).toBe("false");
  });

  it("sem tela de entrada e sem deep link: nada de sair do app", () => {
    const params = hashParams(JOIN);
    expect(params.get("config.prejoinConfig.enabled")).toBe("false");
    expect(params.get("config.disableDeepLinking")).toBe("true");
  });

  it("o endereço não carrega a sessão da pessoa", () => {
    expect(callEmbedUrl(JOIN)).not.toMatch(/session|password|senha/i);
  });
});

describe("callEmbedUrl — opções que o Epapo aplica de fato", () => {
  // O Epapo descarta em silêncio qualquer `config.*` que não esteja na lista de override dele
  // (`react/features/base/config/configWhitelist.ts`) e qualquer `config.*` que esteja na query
  // em vez da barra. As duas coisas já aconteceram: a chamada abria com P2P ligado e com a tela
  // de entrada, e o pedido de desligar não fazia nada. Este teste trava as duas.
  const WHITELIST = new Set([
    "p2p.enabled",
    "startWithVideoMuted",
    "prejoinConfig.enabled",
    "disableDeepLinking",
  ]);

  it("manda toda opção na barra, nunca na query", () => {
    const url = new URL(callEmbedUrl(JOIN));
    expect([...url.searchParams.keys()]).toEqual(["jwt"]);
    expect(url.hash.startsWith("#config.")).toBe(true);
  });

  it("só usa chave que o Epapo aceita sobrescrever", () => {
    for (const key of hashParams(JOIN).keys()) {
      expect(key.startsWith("config.")).toBe(true);
      expect(WHITELIST.has(key.slice("config.".length))).toBe(true);
    }
  });

  it("desliga o P2P: a mídia passa pela ponte do servidor", () => {
    // Com P2P ligado, dois participantes montam a conexão direta e a chamada deixa de passar
    // pelo Epapo; com três ou mais a sala é remontada na ponte no meio do caminho.
    expect(hashParams(JOIN).get("config.p2p.enabled")).toBe("false");
    expect(hashParams({ ...JOIN, modality: "GROUP" }).get("config.p2p.enabled")).toBe("false");
  });
});

describe("isTrustedCallHost", () => {
  it("aceita só a origem exata do nosso servidor de reunião", () => {
    expect(isTrustedCallHost("https://meet.enois.ia.br")).toBe(true);
    expect(isTrustedCallHost("https://meet.enois.ia.br/")).toBe(true);
  });

  it("recusa outro host, parecido, sem https, com caminho ou lixo", () => {
    for (const host of [
      "https://outro-servidor.example",
      "https://meet.enois.ia.br.example.org",
      "https://evil.example/meet.enois.ia.br",
      "http://meet.enois.ia.br",
      "https://meet.enois.ia.br/sala",
      "https://meet.enois.ia.br?x=1",
      "https://user@meet.enois.ia.br.example.org",
      "javascript:alert(1)",
      "",
      "não é url",
    ]) {
      expect(isTrustedCallHost(host), host).toBe(false);
    }
  });

  it("a url do iframe nunca é montada para um host desconhecido", () => {
    expect(() => callEmbedUrl({ ...JOIN, host: "https://outro-servidor.example" })).toThrow();
  });
});
