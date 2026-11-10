import { useSyncExternalStore } from "react";

import type { CallJoin } from "@/types/application/call/call-join";
import type { CallModality } from "@/types/application/call/call-modality";
import type { CallPhase } from "@/types/application/call/call-phase";
import type { CallSessionState } from "@/types/application/call/call-session-state";
import type { CallSwap } from "@/types/application/call/call-swap";
import type { CallView } from "@/types/application/call/call-view";
import { isTerminalState } from "@/types/application/call/is-terminal-state";

/**
 * A chamada aberta na tela agora — uma por aba.
 *
 * Minimizar e expandir alteram só a apresentação: o painel mantém o iframe e a credencial.
 * Uma falha de entrada ou perda de credencial pede recuperação pelo servidor separadamente,
 * sem transformar cada expansão em uma nova entrada na sala. A recuperação da mesma chamada
 * mantém a minimização; uma entrada explícita continua abrindo o painel.
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

/**
 * Quantas chamadas esperam atrás da de cima. Passando disso a nova não entra na fila: segue tocando
 * no servidor até quem ligou desistir ou o toque vencer. Recusar por conta própria não é opção,
 * porque nada é recusado sem um clique da pessoa.
 */
export const MAX_WAITING = 5;

let state: CallSessionState = IDLE;
const listeners = new Set<() => void>();

/**
 * Chamada que a pessoa largou de propósito nesta aba.
 *
 * No grupo a sala continua aberta no servidor (para os outros), e o stream segue avisando que ela
 * está ACTIVE. Sem esta marca, a próxima resposta reabria a sala que a pessoa acabou de fechar.
 * Ela não muda o desenho da tela, então fica fora do estado: só um clique explícito em entrar,
 * atender ou começar uma chamada a apaga.
 */
let leftCallId: string | null = null;

export function wasCallLeft(callId: string): boolean {
  return leftCallId === callId;
}

/** Clique explícito na mesma chamada (ou pedido de teste): a marca deixa de valer. */
export function forgetLeftCall(callId?: string): void {
  if (callId !== undefined && leftCallId !== callId) return;
  leftCallId = null;
}

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

/**
 * A chamada que a tela está mostrando, quando a pessoa está de fato em uma sala.
 *
 * `ended` fica de fora de propósito: ali a cópia da chamada é só o motivo do aviso, e tratar
 * isso como presença mandaria um "sair" para uma chamada que já terminou.
 */
export function callInRoom(): { id: string; modality: CallModality } | null {
  const current = state.call;
  if (!current) return null;
  if (state.phase === "idle" || state.phase === "ended") return null;
  return { id: current.id, modality: current.modality };
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
    const others = state.waiting.filter((held) => held.id !== call.id);
    if (others.length === state.waiting.length && others.length >= MAX_WAITING) return;
    set({ waiting: [...others, call] });
  },

  /** Atualiza o estado vindo do servidor sem perder a credencial já obtida. */
  update(call: CallView) {
    set({ call });
  },

  /** Estado novo de uma chamada da fila: a de cima não muda. */
  updateWaiting(call: CallView) {
    if (!state.waiting.some((held) => held.id === call.id)) return;
    set({ waiting: state.waiting.map((held) => (held.id === call.id ? call : held)) });
  },

  /**
   * Entrada a caminho. A chamada vai junto: quem clicou em "entrar" precisa ver a tela abrir
   * naquele instante, mesmo entrando do zero (até aqui o painel só desenhava com a credencial
   * pronta, e quem estava de fora não via nada acontecer até ela chegar).
   */
  joining(call?: CallView) {
    set({
      phase: "joining",
      call: call ?? state.call,
      error: null,
      notConfigured: false,
      minimized: state.minimized && state.needsRejoin && (!call || call.id === state.call?.id),
    });
  },

  /** A tela pediu credencial nova; o provider consome e zera na mesma volta. */
  requestCredential() {
    set({ phase: "joining", error: null, notConfigured: false, needsCredential: true });
  },

  credentialConsumed() {
    set({ needsCredential: false });
  },

  live(join: CallJoin) {
    const minimized =
      state.phase === "joining" &&
      state.needsRejoin &&
      state.minimized &&
      state.call?.id === join.callId;
    set({
      phase: "live",
      call: join.call,
      join,
      error: null,
      notConfigured: false,
      needsRejoin: false,
      needsCredential: false,
      minimized,
    });
  },

  minimize() {
    set({ minimized: true });
  },

  expand() {
    if (state.phase === "live" && (!state.join || state.needsRejoin)) {
      set({ minimized: false, needsRejoin: true, needsCredential: true, phase: "joining" });
      return;
    }
    set({ minimized: false });
  },

  /** Falha real do iframe: pede credencial nova ao servidor, sem esperar a expansão. */
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
   * A pessoa escolheu atender uma da fila antes da de cima: a da fila assume a tela.
   *
   * A que estava tocando volta para a fila em vez de sumir: ela continua tocando no servidor e
   * ninguém a recusou. A que estava na sala (ou entrando nela) não volta: a pessoa sai dela, e
   * quem chama avisa o servidor (`left`), senão o outro lado a veria conectada até o servidor
   * desistir. Devolve `null` se a escolhida já não estava na fila.
   */
  swapWaiting(callId: string): CallSwap | null {
    const next = state.waiting.find((held) => held.id === callId);
    if (!next) return null;
    const rest = state.waiting.filter((held) => held.id !== callId);
    const previous = state.call;
    const inRoom = state.phase === "live" || state.phase === "joining";
    const requeue = previous !== null && !inRoom && !isTerminalState(previous.state);
    state = {
      ...IDLE,
      phase: next.isInitiator ? "calling" : "incoming",
      call: next,
      waiting: requeue ? [...rest, previous] : rest,
    };
    listeners.forEach((listener) => listener());
    return { next, left: inRoom ? previous : null };
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
   * Fecha a tela de uma chamada que a pessoa largou e guarda a marca: no grupo a sala continua
   * aberta para os outros, mas esta aba não reentra nela sozinha. A fila continua, como em
   * {@link idle}.
   */
  markLeft(callId: string) {
    leftCallId = callId;
    const waiting = state.waiting.filter((held) => held.id !== callId);
    state = waiting.length === 0 ? IDLE : { ...IDLE, waiting };
    listeners.forEach((listener) => listener());
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
