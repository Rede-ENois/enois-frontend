import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { isTrustedCallHost } from "@/types/application/call/call-embed-url";
import type { CallKind } from "@/types/application/call/call-kind";
import type { CallPhase } from "@/types/application/call/call-phase";
import type { CallState } from "@/types/application/call/call-state";
import type { CallView } from "@/types/application/call/call-view";
import type { CallsContextValue } from "@/types/application/call/calls-context-value";
import { isTerminalState } from "@/types/application/call/is-terminal-state";

import { callsApi } from "@/lib/api";
import { ApiError, apiUrl } from "@/lib/api-client";
import { callSessionStore, getCallSession, useCallSession } from "@/lib/calls/call-session";
import { hangUpOnServer, leaveAnsweredRoom } from "@/lib/calls/use-hang-up";
import { readEconomicMode } from "@/lib/lite-mode";
import { subscribeToCallEvents } from "@/lib/message-stream";
import { hasSession } from "@/lib/require-auth";
import { useIsAuthenticated } from "@/lib/use-auth";

import { CallPanel } from "./call-panel";
import { startRingtone } from "./call-ringtone";

/**
 * A chamada vive no topo do app, não numa tela: começar, receber, atender e encerrar funcionam em
 * qualquer página, e o painel é um overlay interno (iframe do Jitsi) — nunca uma aba nova.
 *
 * Quem decide tudo é o servidor. Este componente escuta o stream (`event: call`), confere o
 * estado real pelas rotas de chamadas e traduz para a tela.
 */

/** Intervalo de conferência da chamada aberta (o stream avisa antes; isto só cobre queda). */
const POLL_MS = 10_000;

/** Quanto tempo a tela de "chamada encerrada" fica antes de sumir sozinha. */
const ENDED_DISMISS_MS = 2_500;

const noSession: CallsContextValue = {
  startDirect: async () => {},
  startGroup: async () => {},
  answer: async () => {},
  decline: async () => {},
  open: async () => {},
  close: () => {},
  call: null,
};

const CallsContext = createContext<CallsContextValue | null>(null);

/**
 * Ações da chamada para as telas. Sem sessão (ou antes da hidratação) as ações avisam e não fazem
 * nada: nenhuma tela precisa checar login para desenhar o botão.
 */
export function useCalls(): CallsContextValue {
  return useContext(CallsContext) ?? noSession;
}

/** A chamada aberta do vínculo: é o banner "Chamando…" / "🔴 ao vivo" da conversa e do grupo. */
export function useOpenCall(input: {
  conversationId?: string;
  groupId?: string;
  topicId?: string;
}) {
  const session = useCallSession();
  const query = useQuery({
    queryKey: [
      "calls",
      "open",
      input.conversationId ?? null,
      input.groupId ?? null,
      input.topicId ?? null,
    ],
    queryFn: () =>
      input.conversationId
        ? callsApi.openOfConversation(input.conversationId)
        : input.topicId
          ? callsApi.openOfTopic(input.groupId ?? "", input.topicId)
          : callsApi.openOfGroup(input.groupId ?? ""),
    enabled: Boolean(input.conversationId || input.groupId),
    refetchInterval: POLL_MS,
  });
  const mine = session.call;
  // A sala do tópico e a sala geral do grupo são chamadas diferentes: comparar só o grupo
  // mostraria a sala errada no banner do tópico.
  const sameLink =
    mine !== null &&
    ((input.conversationId !== undefined && mine.conversationId === input.conversationId) ||
      (input.groupId !== undefined &&
        mine.groupId === input.groupId &&
        (mine.topicId ?? null) === (input.topicId ?? null)));
  if (sameLink && !isTerminalState(mine.state)) {
    return { call: mine, isLoading: false };
  }
  return { call: query.data ?? null, isLoading: query.isLoading };
}

/** Ações do runtime ativo; fora de uma sessão, as telas falam com o "sem sessão". */
let runtimeValue: CallsContextValue = noSession;

/** O ambiente ainda não tem servidor de chamadas: é aviso, não falha da pessoa. */
function isNotConfigured(error: unknown): boolean {
  return error instanceof ApiError && error.code === "CALLS_NOT_CONFIGURED";
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CALLS_NOT_CONFIGURED") return texts.calls.notConfigured;
    return error.message;
  }
  return texts.calls.loadError;
}

/** Fecha a tela com o motivo certo: aviso de ambiente em configuração ou erro explícito. */
function failWith(error: unknown) {
  callSessionStore.error(messageFor(error), { notConfigured: isNotConfigured(error) });
}

/**
 * A tela está livre para a próxima da fila. Erro ainda ocupa a tela: a pessoa viu um aviso e é ela
 * que fecha. "Joining" também: a credencial daquela chamada está a caminho.
 */
function isSlotFree(phase: CallPhase): boolean {
  return phase === "idle" || phase === "ended";
}

/**
 * Estado do servidor de uma chamada que não está na tela: atualiza ou tira da fila, e uma chamada
 * nova tocando entra nela. Nunca toma a tela da chamada de cima.
 */
function applyToOtherCall(next: CallView) {
  const queued = getCallSession().waiting.some((held) => held.id === next.id);
  if (isTerminalState(next.state)) {
    callSessionStore.removeWaiting(next.id);
    return;
  }
  if (queued) {
    callSessionStore.updateWaiting(next);
    return;
  }
  if (next.state === "RINGING") {
    callSessionStore.ring(next, next.isInitiator ? "calling" : "incoming");
  }
}

/**
 * Só a casca (chamadas, dock, autenticação). Os filhos são renderizados uma vez: um provider
 * condicional mudaria o tipo da árvore entre "sem sessão" e "com sessão" e remontaria tudo depois
 * da hidratação.
 */
export function CallsProvider({ children }: { children: React.ReactNode }) {
  const authenticated = useIsAuthenticated();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const inner =
    !hydrated || !authenticated || !hasSession() ? (
      <>{children}</>
    ) : (
      <CallsRuntime>{children}</CallsRuntime>
    );
  return <CallsContext.Provider value={runtimeValue}>{inner}</CallsContext.Provider>;
}

function CallsRuntime({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const session = useCallSession();
  const call = session.call;
  const silent = useRef(readEconomicMode());
  const phaseRef = useRef(session.phase);
  phaseRef.current = session.phase;

  const refreshRelated = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["calls"] });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [queryClient]);

  /**
   * Pede a credencial ao servidor e abre o painel com o Jitsi.
   *
   * Devolve `"left"` quando a entrada chegou a ser registrada e a sala não abriu (a saída já foi
   * avisada) e `"failed"` quando a credencial nem veio — quem chamou decide se ainda há presença
   * para largar.
   */
  const enterRoom = useCallback(async (target: CallView): Promise<"live" | "left" | "failed"> => {
    // A chamada vai junto: quem clica em "entrar" vê a tela abrir na hora, em vez de achar que
    // o clique não fez nada enquanto a credencial não chega.
    callSessionStore.joining(target);
    try {
      const join = await callsApi.join(target.id);
      // O iframe ganha câmera e microfone: só abre no servidor de reunião que a gente hospeda.
      if (!isTrustedCallHost(join.host)) {
        // Pedir a credencial já registra a entrada no servidor: sem o aviso de saída a pessoa
        // fica presa na sala (no 1:1, o outro lado a vê conectada até a tolerância vencer).
        await leaveAnsweredRoom(target);
        callSessionStore.error(texts.calls.untrustedRoom);
        return "left";
      }
      callSessionStore.live(join);
      return "live";
    } catch (error) {
      if (error instanceof ApiError && error.code?.startsWith("CALL_")) {
        // A chamada terminou entre o clique e a entrada: mostra o motivo, não um erro seco.
        try {
          const current = await callsApi.get(target.id);
          callSessionStore.ended(current);
          return "failed";
        } catch {
          // segue para o erro explícito abaixo
        }
      }
      failWith(error);
      return "failed";
    }
  }, []);

  /** Aplica o que o servidor respondeu: termina com motivo, segue tocando ou entra na sala. */
  const applyServerState = useCallback(
    (next: CallView) => {
      const phase = phaseRef.current;
      // Resposta de outra chamada que não a da tela (a da fila, a que acabou de sair dela numa
      // troca): mexe só na fila. Aplicada na de cima, ela trocava a chamada da tela pela antiga
      // por um instante, ou abria a sala dela por cima da que a pessoa acabou de escolher.
      // Lê o store, não o render: a troca muda a chamada da tela antes do próximo render.
      const screen = getCallSession();
      const busy = !isSlotFree(screen.phase) && screen.phase !== "error";
      if (screen.call !== null && screen.call.id !== next.id && busy) {
        applyToOtherCall(next);
        refreshRelated();
        return;
      }
      if (isTerminalState(next.state)) {
        if (phase !== "ended") callSessionStore.ended(next);
        refreshRelated();
        return;
      }
      if (next.state === "RINGING" || next.state === "CONNECTING") {
        if (phase === "idle" || phase === "ended" || phase === "error") {
          callSessionStore.ring(next, next.isInitiator ? "calling" : "incoming");
        } else {
          callSessionStore.update(next);
        }
        refreshRelated();
        return;
      }
      // ACTIVE: se ainda não estamos dentro, entra (voltar de outra tela, aceite em outra aba).
      // A decisão lê o store, não o `phase` deste render: uma resposta que chegue enquanto a
      // entrada está a caminho abria uma segunda entrada.
      //
      // `error` fica de fora: uma entrada que falhou espera a pessoa clicar de novo. Reentrar
      // sozinho a cada conferência transformava uma recusa em tentativa atrás de tentativa.
      const inRoom = getCallSession().phase;
      if (inRoom !== "live" && inRoom !== "joining" && inRoom !== "error") {
        void enterRoom(next);
      }
      callSessionStore.update(next);
      refreshRelated();
    },
    [enterRoom, refreshRelated],
  );

  // Reconexão: painel reaberto (ou sem mídia) pede credencial nova em vez de abrir a sala às cegas.
  // O pedido é consumido antes da entrada, para não ser rearmado pela resposta que vem:
  // `needsCredential` é um pedido de uma vez, não um estado de espera.
  useEffect(() => {
    if (!session.needsCredential || !session.call) return;
    callSessionStore.credentialConsumed();
    void enterRoom(session.call);
  }, [session.needsCredential, session.call, enterRoom]);

  // O stream avisa na hora; a consulta busca o estado real (o evento só traz ids).
  useEffect(() => {
    return subscribeToCallEvents((callId) => {
      void callsApi
        .get(callId)
        .then(applyServerState)
        .catch(() => {
          // Chamada que não é nossa (ou já sumiu): ignora, a tela não muda.
        });
    });
  }, [applyServerState]);

  // Chamada em aberto: confere o estado no servidor de tempos em tempos (o stream avisa antes).
  // A conferência depende só do id: uma resposta que atualiza a chamada mudava a identidade de
  // `session.call`, o efeito remontava e a conferência saía de novo — durante a espera de uma
  // reconexão, isso virava uma consulta atrás da outra.
  const openCallId = session.call && !isTerminalState(session.call.state) ? session.call.id : null;
  useEffect(() => {
    if (!openCallId) return;
    const tick = () => {
      void callsApi
        .get(openCallId)
        .then(applyServerState)
        .catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 404) callSessionStore.idle();
          // Outra falha (rede) não derruba a tela: o próximo ciclo tenta de novo.
        });
    };
    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [openCallId, applyServerState]);

  // Ao (re)abrir o app, volta para a chamada que ficou aberta.
  useEffect(() => {
    let cancelled = false;
    void callsApi
      .open()
      .then((open) => {
        if (cancelled || open.length === 0 || phaseRef.current !== "idle") return;
        const active =
          open.find(
            (candidate) => candidate.state === "RINGING" || candidate.state === "CONNECTING",
          ) ?? open[0];
        if (active.state === "ACTIVE") {
          void enterRoom(active);
        } else if (active.state === "RINGING") {
          callSessionStore.ring(active, active.isInitiator ? "calling" : "incoming");
        }
      })
      .catch(() => {
        // Sem chamadas abertas (ou chamadas desligadas neste ambiente): nada a retomar.
      });
    return () => {
      cancelled = true;
    };
    // Só na montagem: depois quem manda é o stream e a conferência periódica.
  }, []);

  // Toque da chamada recebida: só 1:1 (grupo nunca toca) e nunca em modo lite/BATATA. A fila
  // conta: uma 1:1 esperando atrás de uma chamada em grupo também precisa tocar, senão ela chega
  // em silêncio e a pessoa só descobre quando a de cima termina.
  // Dentro da sala (ou entrando nela) não toca: o toque cobriria a conversa. A da fila segue
  // visível na tela.
  const inRoom = session.phase === "live" || session.phase === "joining";
  const ringing =
    !inRoom &&
    ((session.phase === "incoming" && call?.modality === "DIRECT") ||
      session.waiting.some((held) => held.modality === "DIRECT"));
  useEffect(() => {
    if (!ringing) return;
    return startRingtone({ enabled: !silent.current });
  }, [ringing]);

  // Chamada encerrada some sozinha depois de mostrar o motivo. A próxima da fila assume antes
  // disso: a tela do "encerrada" é da chamada anterior e não pode atrasar quem está tocando.
  useEffect(() => {
    if (session.phase !== "ended") return;
    const timer = setTimeout(() => callSessionStore.idle(), ENDED_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [session.phase]);

  // Fila: chamada que chegou com outra na tela entra quando a de cima termina (ou antes, por
  // "Atender esta"). O estado real vem do servidor — a fila guarda só quem tocou.
  const heldId = session.waiting[0]?.id ?? null;
  useEffect(() => {
    if (heldId === null) return;
    if (!isSlotFree(session.phase)) return;
    const next = callSessionStore.promoteWaiting();
    if (!next) return;
    void callsApi
      .get(next.id)
      .then(applyServerState)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
          callSessionStore.removeWaiting(next.id);
          return;
        }
        // Rede fora: a próxima conferência da chamada promovida tenta de novo.
      });
  }, [heldId, session.phase, applyServerState]);

  // Aba fechada/atualizada dentro da chamada: avisa o servidor para não ficar pendurada.
  useEffect(() => {
    if (!openCallId) return;
    const onPageHide = () => {
      // sendBeacon leva a cookie de sessão da mesma origem (não dá para pôr header).
      navigator.sendBeacon?.(apiUrl(`/calls/${openCallId}/leave`));
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [openCallId]);

  const start = useCallback(
    async (run: () => Promise<CallView>) => {
      try {
        const started = await run();
        if (started.state === "ACTIVE" || started.state === "CONNECTING") {
          // "Tamo junto" nasce ao vivo: quem abre já entra.
          await enterRoom(started);
        } else {
          callSessionStore.ring(started, started.isInitiator ? "calling" : "incoming");
        }
        refreshRelated();
      } catch (error) {
        failWith(error);
      }
    },
    [enterRoom, refreshRelated],
  );

  /**
   * Atende. Sem id, é a chamada da tela; com id, é a que está na fila: ela assume a tela. Se a
   * pessoa estava numa sala, o servidor fica sabendo que ela saiu antes de a outra ser atendida.
   */
  const answer = useCallback(
    async (callId?: string) => {
      let current: CallView | null;
      if (callId) {
        const swap = callSessionStore.swapWaiting(callId);
        current = swap?.next ?? null;
        if (swap?.left) await hangUpOnServer(swap.left);
      } else {
        current = getCallSession().call;
      }
      if (!current) return;
      try {
        const answered = await callsApi.answer(current.id);
        // `answer` já registrou a presença no servidor: se a sala não abrir, a saída é avisada
        // aqui. Sem isso a pessoa fica contada na chamada até a tolerância de abandono vencer.
        const outcome = await enterRoom(answered);
        if (outcome === "failed") await leaveAnsweredRoom(answered);
        refreshRelated();
      } catch (error) {
        // O atendimento em si falhou: a presença não foi registrada, então não há o que largar.
        failWith(error);
      }
    },
    [enterRoom, refreshRelated],
  );

  const decline = useCallback(
    async (callId?: string) => {
      const current = callId
        ? getCallSession().waiting.find((held) => held.id === callId)
        : getCallSession().call;
      if (callId) {
        callSessionStore.removeWaiting(callId);
      } else {
        callSessionStore.idle();
      }
      if (!current) return;
      try {
        await callsApi.decline(current.id);
      } catch {
        // Já terminou do outro lado: a tela fecha do mesmo jeito.
      } finally {
        refreshRelated();
      }
    },
    [refreshRelated],
  );

  const open = useCallback(
    async (callId: string) => {
      try {
        const target = await callsApi.get(callId);
        if (isTerminalState(target.state)) {
          callSessionStore.ended(target);
          return;
        }
        if (target.state === "RINGING") {
          callSessionStore.ring(target, target.isInitiator ? "calling" : "incoming");
          return;
        }
        await enterRoom(target);
      } catch (error) {
        failWith(error);
      }
    },
    [enterRoom],
  );

  const value = useMemo<CallsContextValue>(
    () => ({
      startDirect: (conversationId, kind) =>
        start(() => callsApi.startDirect(conversationId, kind)),
      startGroup: (groupId, kind, topicId) =>
        start(() =>
          topicId
            ? callsApi.startTopicCall(groupId, topicId, kind)
            : callsApi.startGroup(groupId, kind),
        ),
      answer,
      decline,
      open,
      close: () => callSessionStore.idle(),
      call,
    }),
    [start, answer, decline, open, call],
  );

  // As telas leem as ações por `useCalls()` (contexto). O contexto mora acima deste componente —
  // que só existe depois do login — então a instância ativa é publicada aqui, no corpo do render,
  // antes de qualquer filho desenhar. Fora deste runtime, `useCalls()` responde "sem sessão".
  runtimeValue = value;

  return (
    <>
      {children}
      {session.phase === "idle" ? null : <CallPanel />}
    </>
  );
}

/** Nome do estado para a tela ("Chamando…", "Em andamento"). */
export function stateLabel(state: CallState): string {
  switch (state) {
    case "INITIATING":
    case "RINGING":
      return texts.calls.ringing;
    case "CONNECTING":
      return texts.calls.connecting;
    case "ACTIVE":
      return texts.calls.active;
    case "DECLINED":
      return texts.calls.declined;
    case "MISSED":
      return texts.calls.missed;
    case "CANCELLED":
      return texts.calls.cancelled;
    case "ENDED":
      return texts.calls.ended;
    case "FAILED":
      return texts.calls.failed;
  }
}
