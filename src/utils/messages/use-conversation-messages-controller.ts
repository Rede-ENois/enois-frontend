import { useMessagesStore } from "@/stores/messages.store";
import { createConversationMessageItems } from "@/utils/messages/create-conversation-message-items";
import { useConversationScrollAnchor } from "@/utils/messages/use-conversation-scroll-anchor";

import { getCurrentUserId } from "@/lib/get-current-user-id";
import { useConversationMessages } from "@/lib/messages/use-conversation-messages";
import { useConversationParticipant } from "@/lib/messages/use-conversation-participant";
import { useConversationSelection } from "@/lib/messages/use-conversation-selection";

export function useConversationMessagesController() {
  const conversationId = useMessagesStore((state) => state.activeConversationId);
  const currentUserId = getCurrentUserId();
  const conversation = useConversationSelection(conversationId);
  const messages = useConversationMessages(conversation?.id);
  const { otherParticipantId, otherUser } = useConversationParticipant(conversation, currentUserId);

  return {
    messagesEndRef: useConversationScrollAnchor(messages.length),
    showEmptyState: messages.length === 0,
    otherProfileUsername: otherUser?.username ?? otherParticipantId ?? "",
    otherAvatar: otherUser?.avatar,
    otherName: otherUser?.name,
    items: createConversationMessageItems(messages, currentUserId),
  };
}
