import { useMessagesStore } from "@/stores/messages.store";
import type { ConversationItemProps } from "@/types/components/messages/conversation-item-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { useConversationCounterpart } from "@/utils/components/messages/use-conversation-counterpart";
import { useConversationReadAction } from "@/utils/components/messages/use-conversation-read-action";

export function useConversationItemController({ conversation }: ConversationItemProps) {
  const counterpart = useConversationCounterpart(conversation);
  const selectConversation = useMessagesStore((state) => state.selectConversation);
  const markAsRead = useConversationReadAction();

  return {
    ...counterpart,
    timeLabel: conversation.time ? formatRelativeTime(conversation.time) : "",
    showUnread: conversation.unread > 0,
    select: () => {
      selectConversation(conversation.id);
      if (conversation.unread > 0) markAsRead(conversation.id);
    },
  };
}
