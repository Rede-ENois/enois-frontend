import { getCurrentUserId } from "@/lib/get-current-user-id";
import { useConversationMessages } from "@/lib/use-conversation-messages";
import { useConversationParticipant } from "@/lib/use-conversation-participant";
import { useConversationSelection } from "@/lib/use-conversation-selection";

export function useActiveConversationController(conversationId?: string | null) {
  const currentUserId = getCurrentUserId();
  const activeConversation = useConversationSelection(conversationId);
  const activeMessages = useConversationMessages(activeConversation?.id);
  const { otherParticipantId, otherUser } = useConversationParticipant(
    activeConversation,
    currentUserId,
  );

  return {
    currentUserId,
    activeConversation,
    activeMessages,
    otherParticipantId,
    otherUser,
    showConversation: Boolean(activeConversation),
  };
}
