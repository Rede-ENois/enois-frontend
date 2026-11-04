import { useSyncExternalStore } from "react";

import type { CallJoin } from "@/types/application/call/call-join";
import type { CallPhase } from "@/types/application/call/call-phase";
import type { CallSessionState } from "@/types/application/call/call-session-state";
import type { CallView } from "@/types/application/call/call-view";

/**
 * A chamada aberta na tela agora — uma por aba.
 *
 * Sair da página (inclusive minimizar) desmonta o iframe do Jitsi: então "minimizar" aqui é só
 * esconder visualmente o painel e reinjetar a credencial quando ele volta. Quando a entrada volta
 * falha (token vencido, chamada encerrada), o estado guardado permite reconectar pelo servidor em
 * vez de abrir a sala às cegas.
 */

const IDLE: CallSessionState = {
  phase: "idle",
  call: null,
  join: null,
  minimized: false,
  error: null,
  needsRejoin: false,
  notice: null,
};

let state: CallSessionState = IDLE;
const listeners = new Set<() => void>();

function set(patch: Partial<CallSessionState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCallSession(): CallSessionState {
  return state;
}

export function useCallSession(): CallSessionState {
  return useSyncExternalStore(subscribe, getCallSession, () => IDLE);
}

export const callSessionStore = {
  /** Abre a tela para uma chamada que ainda não tem sala (chamando ou recebendo). */
  ring(call: CallView, phase: "calling" | "incoming") {
    set({ ...IDLE, phase, call });
  },

  /** Atualiza o estado vindo do servidor sem perder a credencial já obtida. */
  update(call: CallView) {
    set({ call });
  },

  joining() {
    set({ phase: "joining", error: null });
  },

  live(join: CallJoin) {
    set({
      phase: "live",
      call: join.call,
      join,
      error: null,
      needsRejoin: false,
      minimized: false,
    });
  },

  minimize() {
    set({ minimized: true });
  },

  expand() {
    set({ minimized: false, needsRejoin: true, phase: "joining" });
  },

  /** O iframe caiu: a próxima abertura pede credencial nova ao servidor. */
  lostCredential() {
    set({ needsRejoin: true, phase: "joining" });
  },

  notice(message: string | null) {
    set({ notice: message });
  },

  ended(call: CallView) {
    set({ call, join: null, phase: "ended", error: null, notice: null });
  },

  error(message: string) {
    set({ phase: "error", error: message, join: null, needsRejoin: false });
  },

  idle() {
    state = IDLE;
    listeners.forEach((listener) => listener());
  },
};
