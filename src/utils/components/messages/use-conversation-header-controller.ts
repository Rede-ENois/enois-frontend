import type { ConversationHeaderProps } from "@/types/components/messages/conversation-header-props";

import { useConversationCounterpart } from "@/utils/components/messages/use-conversation-counterpart";

export function useConversationHeaderController({ conversation }: ConversationHeaderProps) {
  return useConversationCounterpart(conversation);
}
