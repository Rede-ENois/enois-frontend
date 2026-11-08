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
    callSessionStore.idle();
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
 * sala, encerra. Também é o caminho de quem troca de chamada no meio de uma ligação.
 */
export async function hangUpOnServer(call: CallView): Promise<void> {
  const ringing = call.state === "RINGING" || call.state === "CONNECTING";
  try {
    if (ringing && call.isInitiator) await callsApi.cancel(call.id);
    else if (ringing) await callsApi.decline(call.id);
    else await callsApi.end(call.id);
  } catch {
    // Já terminou do outro lado: a tela segue do mesmo jeito.
  }
}
