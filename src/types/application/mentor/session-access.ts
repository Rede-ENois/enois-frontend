/**
 * Entrada autorizada numa sessão de mentoria (`POST /mentors/{id}/sessions/{sessionId}/join`).
 *
 * A sala do Epapo vem com um token curto assinado pelo servidor de reunião — o segredo de
 * assinatura nunca sai do servidor. Sala própria do mentor vem só com o link (`jwt` nulo).
 */
export type SessionAccess = {
  sessionId: string;
  roomUrl: string | null;
  jwt: string | null;
  tokenTtlSeconds: number;
};
