import { useEffect, useRef } from "react";

import type { ConversationMessagesProps } from "@/types/components/messages/conversation-messages-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

export function useConversationMessagesController({
  messages,
  currentUserId,
  otherParticipantId,
  otherUser,
}: ConversationMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return {
    messagesEndRef,
    showEmptyState: messages.length === 0,
    otherProfileUsername: otherUser?.username ?? otherParticipantId ?? "",
    otherAvatar: otherUser?.avatar,
    otherName: otherUser?.name,
    items: messages.map((message) => {
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
    }),
  };
}
