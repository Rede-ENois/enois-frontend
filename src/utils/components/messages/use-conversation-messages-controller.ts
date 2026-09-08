import type { ConversationMessagesProps } from "@/types/components/messages/conversation-messages-props";
import { createConversationMessageItems } from "@/utils/components/messages/create-conversation-message-items";
import { useConversationScrollAnchor } from "@/utils/components/messages/use-conversation-scroll-anchor";

export function useConversationMessagesController({
  messages,
  currentUserId,
  otherParticipantId,
  otherUser,
}: ConversationMessagesProps) {
  return {
    messagesEndRef: useConversationScrollAnchor(messages.length),
    showEmptyState: messages.length === 0,
    otherProfileUsername: otherUser?.username ?? otherParticipantId ?? "",
    otherAvatar: otherUser?.avatar,
    otherName: otherUser?.name,
    items: createConversationMessageItems(messages, currentUserId),
  };
}
