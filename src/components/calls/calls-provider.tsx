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
import type { CallKind } from "@/types/application/call/call-kind";
import type { CallView } from "@/types/application/call/call-view";
import type { CallsContextValue } from "@/types/application/call/calls-context-value";
import { isTerminalState } from "@/types/application/call/is-terminal-state";

import { callsApi } from "@/lib/api";
import { ApiError, apiUrl } from "@/lib/api-client";
import { callSessionStore, getCallSession, useCallSession } from "@/lib/calls/call-session";
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
export function useOpenCall(input: { conversationId?: string; groupId?: string }) {
  const session = useCallSession();
  const query = useQuery({
    queryKey: ["calls", "open", input.conversationId ?? null, input.groupId ?? null],
    queryFn: () =>
      input.conversationId
        ? callsApi.openOfConversation(input.conversationId)
        : callsApi.openOfGroup(input.groupId ?? ""),
    enabled: Boolean(input.conversationId || input.groupId),
    refetchInterval: POLL_MS,
  });
  const mine = session.call;
  const sameLink =
    mine !== null &&
    ((input.conversationId !== undefined && mine.conversationId === input.conversationId) ||
      (input.groupId !== undefined && mine.groupId === input.groupId));
  if (sameLink && !isTerminalState(mine.state)) {
    return { call: mine, isLoading: false };
  }
  return { call: query.data ?? null, isLoading: query.isLoading };
}

/** Ações do runtime ativo; fora de uma sessão, as telas falam com o "sem sessão". */
let runtimeValue: CallsContextValue = noSession;

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CALLS_NOT_CONFIGURED") return texts.calls.notConfigured;
    return error.message;
  }
  return texts.calls.loadError;
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

  /** Pede a credencial ao servidor e abre o painel com o Jitsi. */
  const enterRoom = useCallback(async (target: CallView) => {
    callSessionStore.joining();
    try {
      const join = await callsApi.join(target.id);
      callSessionStore.live(join);
    } catch (error) {
      if (error instanceof ApiError && error.code?.startsWith("CALL_")) {
        // A chamada terminou entre o clique e a entrada: mostra o motivo, não um erro seco.
        try {
          const current = await callsApi.get(target.id);
          callSessionStore.ended(current);
          return;
        } catch {
          // segue para o erro explícito abaixo
        }
      }
      callSessionStore.error(messageFor(error));
    }
  }, []);

  /** Aplica o que o servidor respondeu: termina com motivo, segue tocando ou entra na sala. */
  const applyServerState = useCallback(
    (next: CallView) => {
      const phase = phaseRef.current;
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
      callSessionStore.update(next);
      if (phase !== "live" && phase !== "joining") {
        void enterRoom(next);
      }
      refreshRelated();
    },
    [enterRoom, refreshRelated],
  );

  // Reconexão: painel sem credencial pede uma nova ao servidor em vez de abrir a sala às cegas.
  useEffect(() => {
    if (!session.call || session.join) return;
    if (session.phase !== "joining") return;
    void enterRoom(session.call);
  }, [session.call, session.join, session.phase, enterRoom]);

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
  useEffect(() => {
    if (!session.call || isTerminalState(session.call.state)) return;
    const id = session.call.id;
    const tick = () => {
      void callsApi
        .get(id)
        .then(applyServerState)
        .catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 404) callSessionStore.idle();
          // Outra falha (rede) não derruba a tela: o próximo ciclo tenta de novo.
        });
    };
    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [session.call, applyServerState]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toque da chamada recebida: só 1:1 (grupo nunca toca) e nunca em modo lite/BATATA.
  useEffect(() => {
    if (session.phase !== "incoming" || !call || call.modality !== "DIRECT") return;
    return startRingtone({ enabled: !silent.current });
  }, [session.phase, call]);

  // Chamada encerrada some sozinha depois de mostrar o motivo.
  useEffect(() => {
    if (session.phase !== "ended") return;
    const timer = setTimeout(() => callSessionStore.idle(), ENDED_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [session.phase]);

  // Aba fechada/atualizada dentro da chamada: avisa o servidor para não ficar pendurada.
  useEffect(() => {
    const onPageHide = () => {
      const current = session.call;
      if (!current || isTerminalState(current.state)) return;
      // sendBeacon leva a cookie de sessão da mesma origem (não dá para pôr header).
      navigator.sendBeacon?.(apiUrl(`/calls/${current.id}/leave`));
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [session.call]);

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
        callSessionStore.error(messageFor(error));
      }
    },
    [enterRoom, refreshRelated],
  );

  const answer = useCallback(async () => {
    const current = getCallSession().call;
    if (!current) return;
    try {
      const answered = await callsApi.answer(current.id);
      await enterRoom(answered);
      refreshRelated();
    } catch (error) {
      callSessionStore.error(messageFor(error));
    }
  }, [enterRoom, refreshRelated]);

  const decline = useCallback(async () => {
    const current = getCallSession().call;
    callSessionStore.idle();
    if (!current) return;
    try {
      await callsApi.decline(current.id);
    } catch {
      // Já terminou do outro lado: a tela fecha do mesmo jeito.
    } finally {
      refreshRelated();
    }
  }, [refreshRelated]);

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
        callSessionStore.error(messageFor(error));
      }
    },
    [enterRoom],
  );

  const value = useMemo<CallsContextValue>(
    () => ({
      startDirect: (conversationId, kind) =>
        start(() => callsApi.startDirect(conversationId, kind)),
      startGroup: (groupId, kind) => start(() => callsApi.startGroup(groupId, kind)),
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
