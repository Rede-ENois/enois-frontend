import type { ConversationItemProps } from "@/types/components/messages/conversation-item-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { useConversationCounterpart } from "@/utils/components/messages/use-conversation-counterpart";

export function useConversationItemController({ conversation }: ConversationItemProps) {
  const counterpart = useConversationCounterpart(conversation);

  return {
    ...counterpart,
    timeLabel: conversation.time ? formatRelativeTime(conversation.time) : "",
    showUnread: conversation.unread > 0,
  };
}
