import { useConversations } from "@/lib/messages/use-conversations";

export function useConversationSelection(conversationId?: string | null) {
  const conversations = useConversations();

  if (!conversationId) return null;
  return conversations.find((conversation) => conversation.id === conversationId) ?? null;
}
