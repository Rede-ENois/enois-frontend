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
 *
 * Uma chamada por vez na tela, nunca por atropelo: quem liga com outra já aberta fica em
 * {@link CallSessionState.waiting} e assume quando a atual termina. Nada é atendido nem recusado
 * sem um clique da pessoa.
 */

const IDLE: CallSessionState = {
  phase: "idle",
  call: null,
  join: null,
  minimized: false,
  error: null,
  notConfigured: false,
  needsRejoin: false,
  needsCredential: false,
  notice: null,
  waiting: [],
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
  /**
   * Abre a tela para uma chamada que ainda não tem sala (chamando ou recebendo).
   *
   * Chamada nova com outra já na tela não substitui a de cima: quem já estava tocando ou ao vivo
   * continua, e a nova fica na fila. Antes, a segunda chamada simplesmente apagava a primeira —
   * quem estava ao vivo perdia a tela no meio da ligação, sem ter atendido nem recusado nada.
   */
  ring(call: CallView, phase: "calling" | "incoming") {
    if (state.phase === "idle" || state.call === null) {
      set({ ...IDLE, phase, call });
      return;
    }
    if (state.call.id === call.id) {
      // A mesma chamada tocando de novo é um começo, não uma atualização: `ring` nunca herda a
      // credencial da sala anterior.
      set({ ...IDLE, phase, call, waiting: state.waiting });
      return;
    }
    set({ waiting: [...state.waiting.filter((held) => held.id !== call.id), call] });
  },

  /** Atualiza o estado vindo do servidor sem perder a credencial já obtida. */
  update(call: CallView) {
    set({ call });
  },

  /**
   * Entrada a caminho. A chamada vai junto: quem clicou em "entrar" precisa ver a tela abrir
   * naquele instante, mesmo entrando do zero (até aqui o painel só desenhava com a credencial
   * pronta, e quem estava de fora não via nada acontecer até ela chegar).
   */
  joining(call?: CallView) {
    set({ phase: "joining", call: call ?? state.call, error: null, notConfigured: false });
  },

  /** A tela pediu credencial nova; o provider consome e zera na mesma volta. */
  requestCredential() {
    set({ phase: "joining", error: null, notConfigured: false, needsCredential: true });
  },

  credentialConsumed() {
    set({ needsCredential: false });
  },

  live(join: CallJoin) {
    set({
      phase: "live",
      call: join.call,
      join,
      error: null,
      notConfigured: false,
      needsRejoin: false,
      needsCredential: false,
      minimized: false,
    });
  },

  minimize() {
    set({ minimized: true });
  },

  expand() {
    set({ minimized: false, needsRejoin: true, needsCredential: true, phase: "joining" });
  },

  /** O iframe caiu: a próxima abertura pede credencial nova ao servidor. */
  lostCredential() {
    set({ needsRejoin: true, needsCredential: true, phase: "joining" });
  },

  notice(message: string | null) {
    set({ notice: message });
  },

  ended(call: CallView) {
    set({
      call,
      join: null,
      phase: "ended",
      error: null,
      notConfigured: false,
      needsCredential: false,
      notice: null,
      waiting: state.waiting.filter((held) => held.id !== call.id),
    });
  },

  /** `notConfigured` marca o aviso de ambiente ainda em configuração (não é falha da pessoa). */
  error(message: string, options?: { notConfigured?: boolean }) {
    set({
      phase: "error",
      error: message,
      join: null,
      needsRejoin: false,
      needsCredential: false,
      notConfigured: options?.notConfigured ?? false,
    });
  },

  /** Tira da fila a chamada que terminou (atendida, recusada ou cancelada por quem ligou). */
  removeWaiting(callId: string) {
    if (!state.waiting.some((held) => held.id === callId)) return;
    set({ waiting: state.waiting.filter((held) => held.id !== callId) });
  },

  /**
   * A pessoa escolheu atender uma da fila antes da de cima: as duas trocam de lugar.
   *
   * A que estava na tela volta para a fila em vez de sumir — ela continua tocando no servidor e
   * ninguém a recusou. Devolve a que assumiu, ou `null` se ela já não estava na fila.
   */
  swapWaiting(callId: string): CallView | null {
    const next = state.waiting.find((held) => held.id === callId);
    if (!next) return null;
    const rest = state.waiting.filter((held) => held.id !== callId);
    const previous = state.call;
    state = {
      ...IDLE,
      phase: next.isInitiator ? "calling" : "incoming",
      call: next,
      waiting: previous ? [...rest, previous] : rest,
    };
    listeners.forEach((listener) => listener());
    return next;
  },

  /**
   * A chamada de cima acabou e a fila anda: a próxima assume a tela. Devolve a que entrou para o
   * provider buscar o estado real, ou `null` quando não havia ninguém esperando.
   */
  promoteWaiting(): CallView | null {
    const [next, ...rest] = state.waiting;
    if (!next) return null;
    state = {
      ...IDLE,
      phase: next.isInitiator ? "calling" : "incoming",
      call: next,
      waiting: rest,
    };
    listeners.forEach((listener) => listener());
    return next;
  },

  /**
   * Fecha a tela. A fila continua: quem ligou enquanto isso acontecia merece a tela aberta, não um
   * toque no vazio.
   */
  idle() {
    const waiting = state.waiting;
    state = waiting.length === 0 ? IDLE : { ...IDLE, waiting };
    listeners.forEach((listener) => listener());
  },
};
