import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import type { CallView } from "@/types/application/call/call-view";

import { callsApi } from "@/lib/api";

import { callSessionStore, getCallSession } from "./call-session";

/**
 * Sair/desligar a chamada aberta.
 *
 * O servidor é quem sabe a diferença: durante o toque, quem ligou cancela e quem recebeu recusa;
 * na sala, encerrar fecha para os dois no 1:1 e, no grupo, só quem tocou sai (a chamada segue
 * enquanto tiver gente dentro).
 */
export function useHangUp() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    const current = getCallSession().call;
    // A marca vem antes da tela fechar: no grupo o servidor mantém a sala ACTIVE, e a próxima
    // resposta do stream só pode atualizar o banner, nunca reabrir o painel que a pessoa fechou.
    if (current) callSessionStore.markLeft(current.id);
    if (!current) return;
    try {
      await hangUpOnServer(current);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [queryClient]);
}

/**
 * Avisa o servidor que a pessoa largou a chamada: quem ligou cancela, quem recebeu recusa e, na
 * sala, a pessoa sai. Também é o caminho de quem troca de chamada no meio de uma ligação.
 *
 * Na sala vale `leave`, não `end`: no grupo, `end` devolve o encerramento de quem chegou antes
 * sem apagar o registro de presença, e a pessoa continua contada como presente. No 1:1 `leave`
 * encerra a chamada, que é o mesmo efeito aqui.
 */
export async function hangUpOnServer(call: CallView): Promise<void> {
  const ringing = call.state === "RINGING" || call.state === "CONNECTING";
  try {
    if (ringing && call.isInitiator) await callsApi.cancel(call.id);
    else if (ringing) await callsApi.decline(call.id);
    else await callsApi.leave(call.id);
  } catch {
    // Já terminou do outro lado: a tela segue do mesmo jeito.
  }
}

/**
 * Largar uma chamada que o servidor já deu por atendida (`answer` respondeu) e cuja sala não
 * abriu: é `leave` pela mesma razão do {@link hangUpOnServer}.
 */
export async function leaveAnsweredRoom(call: CallView): Promise<void> {
  try {
    await callsApi.leave(call.id);
  } catch {
    // Rede fora ou chamada já encerrada: o servidor fecha a sala pela tolerância de abandono.
  }
}
