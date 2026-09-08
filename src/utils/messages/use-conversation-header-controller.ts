import { useMessagesStore } from "@/stores/messages/messages.store";
import { useConversationCounterpart } from "@/utils/messages/use-conversation-counterpart";

import { useConversationSelection } from "@/lib/messages/use-conversation-selection";

export function useConversationHeaderController() {
  const conversationId = useMessagesStore((state) => state.activeConversationId);
  const conversation = useConversationSelection(conversationId);
  const { otherUser, title, profileUsername } = useConversationCounterpart(conversation);

  return {
    profileUsername,
    avatar: otherUser?.avatar,
    title,
    headline: otherUser?.headline,
  };
}
