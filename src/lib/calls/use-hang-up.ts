import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

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
    const ringing = current.state === "RINGING" || current.state === "CONNECTING";
    try {
      if (ringing && current.isInitiator) await callsApi.cancel(current.id);
      else if (ringing) await callsApi.decline(current.id);
      else await callsApi.end(current.id);
    } catch {
      // Já terminou do outro lado: a tela fecha do mesmo jeito.
    } finally {
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [queryClient]);
}
