import { useMessagesStore } from "@/stores/messages.store";

import { useConversationSelection } from "@/lib/use-conversation-selection";

export function useActiveConversationController() {
  const conversationId = useMessagesStore((state) => state.activeConversationId);
  const activeConversation = useConversationSelection(conversationId);

  return {
    showConversation: Boolean(activeConversation),
  };
}
