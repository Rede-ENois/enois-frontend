import type { Message } from "@/types/messages/message";
import { formatRelativeTime } from "@/utils/format-relative-time";

export function createConversationMessageItems(messages: Message[], currentUserId: string | null) {
  return messages.map((message) => {
    const isMe = message.from === currentUserId;

    return {
      message,
      showAvatar: !isMe,
      rowClassName: isMe ? "justify-end" : "justify-start",
      bubbleClassName: isMe
        ? "rounded-br-md bg-primary text-primary-foreground"
        : "rounded-bl-md bg-card text-foreground",
      timeClassName: isMe ? "text-primary-foreground/70" : "text-muted-foreground",
      timeLabel: formatRelativeTime(message.time),
    };
  });
}
