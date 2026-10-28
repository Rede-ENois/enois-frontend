import { useQuery } from "@tanstack/react-query";

import { useChatDockStore } from "@/stores/chat-dock.store";
import { ChatDockWindow as ChatDockWindowView } from "@rede-enois/design-system/domain";

import { messagesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

import { ConversationThread } from "@/components/messages/conversation-thread";

/**
 * Mini-janela de conversa flutuante. Reaproveita o ConversationThread inteiro —
 * ele ja foi projetado pra viver fora da rota.
 */
export function ChatDockWindow({ conversationId }: { conversationId: string }) {
  const closeChat = useChatDockStore((s) => s.closeChat);
  const { data: currentUser } = useCurrentUser();

  const {
    data: conversation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => messagesApi.getConversation(conversationId),
    staleTime: 60_000,
    retry: 1,
  });

  // Conversa apagada, id antigo no localStorage, ou falha de rede: fecha a janela
  // em vez de ficar no skeleton eterno.
  if (isError || (!isLoading && !conversation)) {
    closeChat(conversationId);
    return null;
  }

  return (
    <ChatDockWindowView
      loading={isLoading || !conversation}
      onClose={() => closeChat(conversationId)}
    >
      {conversation && (
        <ConversationThread conversation={conversation} currentUserId={currentUser?.id ?? null} />
      )}
    </ChatDockWindowView>
  );
}
