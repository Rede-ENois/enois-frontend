import { useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/lib/api";

/** Um pouco menos da metade da validade no servidor (45s): uma requisição perdida não derruba. */
export const VIEWING_HEARTBEAT_MS = 20_000;

/** Tag dos pushes de mensagem de uma conversa (o backend usa o grupo `conversation:{id}`). */
export function conversationPushTag(conversationId: string) {
  return `conversation:${conversationId}`;
}

/** Fecha, neste aparelho, os pushes da conversa que ainda estão na bandeja do sistema. */
export async function closeConversationPushes(conversationId: string) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const open = await registration?.getNotifications({ tag: conversationPushTag(conversationId) });
    open?.forEach((notification) => notification.close());
  } catch {
    // Sem service worker ou sem permissão: não há push na bandeja para fechar.
  }
}

function useDocumentVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/**
 * A conversa aberta e visível na tela:
 * - avisa o servidor (heartbeat) para mensagens dela não virarem notificação nem push para quem
 *   está olhando, e avisa quando sai da tela (troca de conversa, fecha, aba vai para o fundo);
 * - marca a conversa como lida quando há não lidas ou chega mensagem do outro lado enquanto ela
 *   está na tela, e fecha os pushes dela que ficaram na bandeja do aparelho.
 *
 * `latestIncomingId`: id da mensagem mais recente de outra pessoa (null se não há; undefined
 * enquanto as mensagens desta conversa ainda carregam).
 */
export function useConversationOnScreen(
  conversationId: string,
  unread: number,
  latestIncomingId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!visible) return;
    const beat = () => void messagesApi.viewing(conversationId).catch(() => undefined);
    beat();
    const timer = setInterval(beat, VIEWING_HEARTBEAT_MS);
    return () => {
      clearInterval(timer);
      void messagesApi.leftConversation(conversationId).catch(() => undefined);
    };
  }, [conversationId, visible]);

  // Última mensagem recebida já marcada como lida nesta conversa (undefined = nenhuma ainda).
  const marked = useRef<{ conversationId: string; incomingId: string | null } | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!visible || latestIncomingId === undefined) return;
    void closeConversationPushes(conversationId);
    const last = marked.current;
    const sameConversation = last?.conversationId === conversationId;
    const newIncoming = sameConversation && latestIncomingId !== last.incomingId;
    if (unread > 0 || newIncoming) {
      marked.current = { conversationId, incomingId: latestIncomingId };
      void messagesApi
        .markAsRead(conversationId)
        .then(() => queryClient.invalidateQueries({ queryKey: ["conversations"] }))
        .catch(() => undefined);
    } else if (!sameConversation) {
      marked.current = { conversationId, incomingId: latestIncomingId };
    }
  }, [conversationId, visible, unread, latestIncomingId, queryClient]);
}
