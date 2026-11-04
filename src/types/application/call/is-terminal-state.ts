import type { CallState } from "./call-state";

/** A chamada terminou (nenhuma ação possível além de fechar)? */
export function isTerminalState(state: CallState): boolean {
  return (
    state !== "INITIATING" && state !== "RINGING" && state !== "CONNECTING" && state !== "ACTIVE"
  );
}
