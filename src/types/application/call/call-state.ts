/**
 * Estado da chamada. A tela nunca infere: mostra o que o servidor respondeu.
 *
 * - `RINGING`: 1:1 tocando para quem foi chamado.
 * - `CONNECTING`: alguém vai entrar (1:1 atendido ou grupo aberto).
 * - `ACTIVE`: tem gente na sala.
 * - `DECLINED` / `MISSED` / `CANCELLED` / `ENDED` / `FAILED`: terminou.
 */
export type CallState =
  | "INITIATING"
  | "RINGING"
  | "CONNECTING"
  | "ACTIVE"
  | "DECLINED"
  | "MISSED"
  | "CANCELLED"
  | "ENDED"
  | "FAILED";
