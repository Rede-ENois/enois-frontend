import { useMessagesStore } from "@/stores/messages.store";
import { useConversationCounterpart } from "@/utils/components/messages/use-conversation-counterpart";

import { useConversationSelection } from "@/lib/use-conversation-selection";

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
